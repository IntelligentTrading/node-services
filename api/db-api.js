var mongoose = require('mongoose');
var User = require('./models/User');

var options = {
    useMongoClient: true,
    keepAlive: 300,
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500 // Reconnect every 500ms
}

mongoose.connect(process.env.MONGODB_URL, options);

mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected');
});

var database = {
    getUsers: (filters) => {
        var filters_key = Object.keys(filters);
        var query = {};

        filters_key.forEach((key) => {
            var or_conditions = filters[key].split(',');
            if (or_conditions.length <= 1) {
                query['settings.' + key] = filters[key];
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
            return User.find({ chat_id: chat_id })
        }
    },
    addUser: (data) => {
        return User.create(data);
    },
    updateUser: (cid, data) => {

        return database.findUserByChatId(cid).then(users => {
            var user = users[0];
            user.updateSettings(data.settings);
            return user;
        })

    },
    deleteUser: (chat_id) => {
        return User.remove({ chat_id: chat_id })
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
    isITTMember:(token) => {
        return true;
    },
    verifyUser: (chat_id, token) => {
        return database.findUserByChatId(chat_id).then(users => {
            var user = users[0];
            if (user.verify(token)) {
                var settings = {};
                settings.is_subscribed = true;
                settings.beta_token_valid = true;
                if ( database.isITTMember(token))
                    settings.is_ITT_team = true;
                user.updateSettings(settings);
                return user;
            }

            throw new Error('Invalid token');
        })
    }
}


exports.database = database;
