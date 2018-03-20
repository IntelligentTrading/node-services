var marketapi = require('../api/market')
var User = require('../models/User')

module.exports = userController = {
    getUsers: (telegram_chat_id, query) => {
        return telegram_chat_id ? userController.getUser(telegram_chat_id) : getUsers(query)
    },
    getUser: (telegram_chat_id) => {
        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {
            if (!user) {
                var error = new Error('User not found')
                error.code = 404
                throw error
            }

            return user
        })
    },
    createUser: (userSettings) => {
        return User.create(userSettings).then((newUser) => {
            return { code: 201, object: newUser }
        })
    },
    updateUser: (telegram_chat_id, settings) => {
        if (!telegram_chat_id)
            throw new Error('Chat Id cannot be null')

        return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {
            if (settings && user) {

                var settingsToUpdate = Object.keys(settings);
                settingsToUpdate.forEach(settingToUpdate => {
                    user.settings[settingToUpdate] = settings[settingToUpdate];
                })
                user.save()
                return user
            }
        })
    },
    updateUserCurrencies: (telegram_chat_id, currenciesPairRole, settings) => {

        var currenciesPairRoles = ['transaction', 'counter']
        if (currenciesPairRoles.indexOf(currenciesPairRole) < 0) {
            var error = new Error('Path not found')
            error.code = 404
            throw error
        }
        else {
            return User.findOne({ telegram_chat_id: parseInt(telegram_chat_id) }).then(user => {

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
            var ccs = results[2];

            var settings = {};
            Object.keys(user.settings).forEach(property => {
                settings[property] = user.settings[property]
            })
            settings.counter_currencies = [0, 2];
            settings.transaction_currencies = tickersSymbols;
            return settings
        }).then(data => {
            return userController.updateUserSettings(telegram_chat_id, data)
        })
    }
}

var getUsers = (settingsFilters) => {
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
    });

    return User.find(query)
}