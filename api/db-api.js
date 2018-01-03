var mongoose = require('mongoose');
var User = require('./models/User');

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
    findUserByChatId: (chat_id) => {
        var cid = parseInt(chat_id);
        if (cid) {
            return User.find({ telegram_chat_id: chat_id })
        }
    },
    addUser: (data) => {
        return User.create(data);
    },
    upsertUser: (chat_id, data) => {
        return User.update({ telegram_chat_id: chat_id }, data, { upsert: true });
    },
    updateUserSettings: (cid, data) => {

        return database.findUserByChatId(cid).then(users => {
            var user = users[0];
            user.updateSettings(data.settings);
            return user;
        })

    },
    deleteUser: (chat_id) => {
        return User.remove({ telegram_chat_id: chat_id })
    },
    updateUserTransactionCurrencies: (chat_id, data) => {

        return database.findUserByChatId(chat_id).then(users => {
            var user = users[0];
            user.updateUserTransactionCurrencies(data.settings.transaction_currencies);
            return user;
        })
    },
    updateUserCounterCurrencies: (chat_id, data) => {

        return database.findUserByChatId(chat_id).then(users => {
            var user = users[0];
            user.updateUserCounterCurrencies(data.settings.counter_currencies);
            return user;
        })
    },
    verifyUser: (chat_id, token) => {
        return database.getUsers()
            .then(users => {
                if (users && users.length > 0 && users.filter(user => user.beta_token == token && user.telegram_chat_id != chat_id).length > 0) {//token is already in use
                    return { chat_id: chat_id, err: 'Token is already in use.' }
                }
                else {
                    return database.findUserByChatId(chat_id).then(users => {
                        var user = users[0];
                        var team_emojis = process.env.TEAM_EMOJIS.split(',');
                        var isValidBetaToken = parseInt(token, 16) % parseInt(process.env.A_PRIME_NUMBER) == 0;
                        var isValidITTToken = team_emojis.indexOf(token) >= 0;
                        isValidToken = isValidITTToken || isValidBetaToken;

                        var settings = {};
                        if (isValidToken) {
                            user.updateToken(token);
                            settings.beta_token_valid = isValidToken;
                            settings.is_subscribed = true;
                            settings.is_ITT_team = isValidITTToken;
                            user.updateSettings(settings);
                            return user;
                        }

                        return { chat_id: chat_id, err: 'Token is invalid.' }
                    })
                }
            })
            .catch(reason => console.log(reason));
    }
}


exports.database = database;
