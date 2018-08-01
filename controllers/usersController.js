var marketapi = require('../api/market')
var User = require('../models/User')
var SubscriptionTemplate = require('../models/SubscriptionTemplate')
var walletController = require('./walletController')
var dateUtil = require('../util/dates')
var eventBus = require('../events/eventBus')
var moment = require('moment')
var referral = require('../util/referral')

module.exports = userController = {
    getUsers: (settingsFilters) => {
        var filters_key = settingsFilters ? Object.keys(settingsFilters) : [];
        var query = {};

        filters_key.forEach((key) => {
            var or_conditions = settingsFilters[key].split(',');
            if (or_conditions.length <= 1) {
                query['settings.' + key] = settingsFilters[key];
            } else {
                var or_query_array = [];
                or_conditions.forEach(or_condition => {
                    var or_query = {};
                    or_query['settings.' + key] = or_condition;
                    or_query_array.push(or_query);
                })
                query['$or'] = or_query_array;
            }
        })

        return User.find(query)
    },
    getUser: (telegram_chat_id) => {
        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {
            if (!user) {
                var error = new Error('User not found')
                error.statusCode = 404
                throw error
            }
            if (user.settings.ittWalletReceiverAddress == 'No address generated') {
                user.settings.ittWalletReceiverAddress = walletController.getWalletAddressFor(telegram_chat_id)
                user.save()
            }
            if (!user.settings.referral) {
                user.settings.referral = referral.referralGenerator(telegram_chat_id)
                user.settings.referred_count = 0
                user.save()
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
            if (settings && user) {
                if (dateUtil.hasValidSubscription(user)) {
                    var settingsToUpdate = Object.keys(settings);
                    settingsToUpdate.forEach(settingToUpdate => {
                        user.settings[settingToUpdate] = settings[settingToUpdate];
                    })
                    user.save()
                    return user
                }
                else {
                    return Promise.reject(new Error('You must subscribe in order to save settings.'))
                }
            }
            //Update interaction only
            if (user && !settings) {
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
    getSubscriptionTemplate: (label) => {
        return SubscriptionTemplate.findOne({ label: label })
    },
    lastNotifiedSignal: (logObject) => {
        var lastUpdateObject = {
            signalId: logObject.signalId, on: moment()
        }

        return User.update({ telegram_chat_id: { "$in": logObject.subscribersIds } }, { 'settings.lastSignalReceived': lastUpdateObject }, { 'multi': true })
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