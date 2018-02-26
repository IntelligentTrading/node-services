var mongoose = require('mongoose');
var User = require('../models/User');

var argo = require('../util/argo')

var options = {
    useMongoClient: true,
    keepAlive: 300,
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500 // Reconnect every 500ms
}

mongoose.connect(process.env.MONGODB_URI, options);

mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected');
});

var database = {
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
        });

        return User.find(query)
    },
    upsertUser: (chat_id, data) => {
        return User.update({ telegram_chat_id: chat_id }, data, { upsert: true, setDefaultsOnInsert: true });
    },
    updateUserSettings: (chat_id, data) => {

        return User.findOne({ telegram_chat_id: parseInt(chat_id) }).then(user => {
            if (data.settings) {

                var settingsToUpdate = Object.keys(data.settings);
                settingsToUpdate.forEach(settingToUpdate => {
                    user.settings[settingToUpdate] = settings[settingToUpdate];
                })
                user.save()
            }
        })
    },
    updateUserCurrencies: (chat_id, data, currenciesRole) => {

        return User.findOne({ telegram_chat_id: parseInt(chat_id) }).then(user => {

            data.settings[`${currenciesRole}_currencies`].forEach((currency) => {

                var isTransactionCurrency = currenciesRole == 'transaction';
                var key = isTransactionCurrency ? currency.symbol : currency.index;

                if (currency.follow == 'True' || currency.follow == 'true') {
                    user.settings[`${currenciesRole}_currencies`].push(key)
                }
                else {
                    var index_of_victim = user.settings[`${currenciesRole}_currencies`].indexOf(key)
                    if (index_of_victim >= 0) {
                        user.settings[`${currenciesRole}_currencies`].splice(index_of_victim, 1);
                    }
                }
            })

            user.save();
            return user
        })
    }
}

exports.database = database;