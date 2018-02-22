var mongoose = require('mongoose');
var User = require('./models/User');
var Plan = require('./models/Plan');
var License = require('./models/License');
var CryptoFeed = require('./models/CryptoFeed');

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
        return User.update({ telegram_chat_id: chat_id }, data, { upsert: true, setDefaultsOnInsert: true });
    },
    updateUserSettings: (cid, data) => {

        return database.findUserByChatId(cid).then(users => {
            if (!users || users.length == 0) {
                console.log('User not found')
                return null;
            }
            else {
                var user = users[0];
                user.updateSettings(data.settings);
                return user;
            }
        })
    },
    updateUserCurrencies: (chat_id, data, currenciesRole) => {

        return database.findUserByChatId(chat_id).then(users => {
            var user = users[0];

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
    },
    getSignalPlans: (signal) => {
        var clause = {};

        if (signal)
            clause['signals'] = signal;

        return Plan.find(clause);
    },
    getAccessLevelFromPlan: async (plan) => {
        var dbPlan = await Plan.find({ 'plan': plan })
        if (dbPlan)
            return dbPlan[0].accessLevel
        return -1
    },
    setUserLicense: (telegram_chat_id, license, isItt) => {

        var promises = [];

        var subscriberPromise = User.findOne({ telegram_chat_id: telegram_chat_id, eula: true })
        promises.push(subscriberPromise)

        if (!isItt) {
            var planPromise = Plan.findOne({ 'plan': license.plan })
            promises.push(planPromise)

            var licensePromise = License.update({ code: license.code }, { redeemed: true })
            promises.push(licensePromise)
        }

        return Promise.all(promises).then(results => {
            var subscriber = results[0]
            if (!subscriber)
                throw new Error('Your chat id is invalid or you did not accept the EULA!')

            var accessLevel = isItt ? 100 : results[1].accessLevel
            subscriber.settings.is_ITT_Team = isItt
            subscriber.token = license.code
            subscriber.settings.subscription_plan = accessLevel
            subscriber.save()
            return subscriber
        })
    },
    saveNewsFeed: (feed) => {
        return CryptoFeed.update({ feedId: feed.feedId }, feed, { upsert: true, setDefaultsOnInsert: true })
    },
    updateNewsFeed: (feed) => {

        var pushClause = {};
        if (feed.ittBullish)
            pushClause.ittBullish = { $each: feed.ittBullish }
        if (feed.ittBearish)
            pushClause.ittBearish = { $each: feed.ittBearish }
        if (feed.ittImportant)
            pushClause.ittImportant = { $each: feed.ittImportant }

        return CryptoFeed.update({ feedId: feed.feedId }, { $push: pushClause })
            .then(res => {
                return CryptoFeed.find({ feedId: feed.feedId });
            })
    }
}

exports.database = database;