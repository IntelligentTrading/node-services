var marketapi = require('../api/market')
var User = require('../models/User')
var walletController = require('./walletController')
var dateUtil = require('../util/dates')
var eventBus = require('../events/eventBus')
var moment = require('moment')
var referral = require('../util/referral')
var cache = require('../cache').redis
var _ = require('lodash')


function loadCache() {
    return User.find({}).then(users => {
        users.map((user) => {
            if (user && user.telegram_chat_id) {
                user = checkUserSettings(user)
                eventBus.emit('cacheUser', user)
            }
            else {
                console.log('WARNING: misconfigured user')
                console.log(user)
            }
        })
        return users
    })
}

module.exports = userController = {
    all: () => {
        return cache.keysAsync('tci_*').then(keys => {
            if (keys && keys.length > 0) {
                return cache.mgetAsync(keys).then((values) => {
                    if (values)
                        return values.map(value => JSON.parse(value))
                    return []
                })
            }
            else {
                return loadCache()
            }
        })
    },
    refreshCache: () => loadCache(),
    getUser: (telegram_chat_id) => {
        return cache.getAsync(`tci_${telegram_chat_id}`).then((stringifiedUser) => {
            if (stringifiedUser) {
                return JSON.parse(stringifiedUser)
            }
            else {
                return userController.getDbUser(telegram_chat_id).then(user => {
                    eventBus.emit('cacheUser', user)
                    //cacheUser(user)
                    return user
                })
            }
        })
    },
    getDbUser: (telegram_chat_id) => {
        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {
            if (!user) {
                var error = new Error('User not found')
                error.statusCode = 404
                throw error
            }
            return user
        })
    },
    createUser: (userDocument) => {
        return User.create(userDocument).then((newUser) => {
            eventBus.emit('userCreated', newUser)
            return { statusCode: 201, object: newUser }
        })
    },
    updateUser: (telegram_chat_id, settings) => {
        if (!telegram_chat_id) {
            return Promise.reject(new Error('Chat Id cannot be null'))
        }

        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {

            if (user && settings && Object.getOwnPropertyNames(settings).length > 0 && !user.eula)
                return Promise.reject(new Error('You must accept the EULA in order to save settings.'))

            if (user && user.eula) {
                if (settings && dateUtil.hasValidSubscription(user)) {
                    var settingsToUpdate = Object.keys(settings);
                    settingsToUpdate.forEach(settingToUpdate => {
                        user.settings[settingToUpdate] = settings[settingToUpdate];
                    })
                }
                user.save()
                return user
            }
        })
    },
    updateUserCurrencies: (telegram_chat_id, currenciesPairRole, settings) => {

        var currenciesPairRoles = ['transaction', 'counter']
        if (currenciesPairRoles.indexOf(currenciesPairRole) < 0) {
            var error = new Error('Path not found')
            error.statusCode = 404
            return Promise.reject(error)
        }
        else {
            return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) })
                .then(user => {

                    if (dateUtil.hasValidSubscription(user)) {

                        settings.currencies.forEach((currency) => {
                            var isTransactionCurrency = currenciesPairRole == 'transaction';
                            var key = isTransactionCurrency ? currency.symbol : currency.index;

                            if (currency.follow == 'True' || currency.follow == 'true') {
                                user.settings[`${currenciesPairRole}_currencies`].push(key)
                            }
                            else {
                                var index_of_victim = user.settings[`${currenciesPairRole}_currencies`].indexOf(key)
                                if (index_of_victim >= 0) {
                                    user.settings[`${currenciesPairRole}_currencies`].splice(index_of_victim, 1);
                                }
                            }
                        })

                        user.save();
                        return user
                    } else {
                        return Promise.reject(new Error('You must subscribe in order to save settings.'))
                    }
                })
        }
    },
    selectAllSignals: (telegram_chat_id) => {

        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {
            return Promise.all([user, marketapi.tickers(), marketapi.counterCurrencies()])
        }).then(results => {
            var user = results[0];
            var tkrs = results[1];
            var tickersSymbols = tkrs.map(tkr => tkr.symbol);
            var ccs = JSON.parse(results[2])

            var settings = {};
            Object.keys(user.settings).forEach(property => {
                settings[property] = user.settings[property]
            })
            settings.counter_currencies = ccs.filter(cc => cc.enabled == true).map(cc => cc.index)
            settings.transaction_currencies = tickersSymbols;
            return settings
        }).then(data => {
            return userController.updateUser(telegram_chat_id, data)
        })
    },
    resetSignals: (telegram_chat_id) => {
        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {
            user.settings.transaction_currencies = ["BTC", "ETH", "BCH", "XMR", "ZEC", "DASH", "LTC"]
            user.save()
            return user
        })
    },
    lastNotifiedSignal: (logObject) => {
        var lastUpdateObject = {
            signalId: logObject.signalId, on: moment()
        }

        return User.updateMany({ telegram_chat_id: { "$in": logObject.subscribersIds } }, { 'settings.lastSignalReceived': lastUpdateObject }, { 'multi': true })
    },
    checkReferral: (telegram_chat_id, code) => {
        var checkResult = referral.check(telegram_chat_id, code)
        if (checkResult.valid) {

            return User.find({ telegram_chat_id: { $in: [telegram_chat_id, checkResult.referee_telegram_id] } })
                .then(users => {
                    var referred_user = users.filter(u => u.telegram_chat_id == telegram_chat_id)[0]
                    var referrer_user = users.filter(u => u.telegram_chat_id == checkResult.referee_telegram_id)[0]

                    if (!referrer_user) return 'Invalid referral code!'

                    if (!referred_user.settings.referred_by_code) {
                        referred_user.settings.referred_by_code = code
                        referrer_user.settings.referred_count += 1
                        referred_user.save()
                        referrer_user.save()
                        return 'Saved that referral code! Thanks 🙏'
                    }
                    return 'You already used a referral code!'
                })
        }

        return Promise.reject(new Error(checkResult.reason))
    }
}

// This method will be deleted as soon as I run it the first time to fill all the users' wallets and referrals
function checkUserSettings(user) {
    if (user.settings.ittWalletReceiverAddress == 'No address generated') {
        user.settings.ittWalletReceiverAddress = walletController.getWalletAddressFor(user.telegram_chat_id)
        user.save()
    }
    if (!user.settings.referral) {
        user.settings.referral = referral.referralGenerator(user.telegram_chat_id)
        user.settings.referred_count = 0
        user.save()
    }
    return user
}