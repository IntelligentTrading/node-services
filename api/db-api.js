var mongoose = require('mongoose');
var User = require('./models/User');
var Plan = require('./models/Plan');
var License = require('./models/License');
var CryptoFeed = require('./models/CryptoFeed');

var Argo = require('../util/argo').argo;

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
    subscribeUser: (chat_id, token) => {
        return database.getUsers()
            .then(users => {
                if (users && users.length > 0 && users.filter(user => user.token == token && user.telegram_chat_id != chat_id).length > 0) {//token is already in use
                    return { chat_id: chat_id, err: 'Token is already redeemed by another user.' }
                }
                else {
                    return database.findUserByChatId(chat_id).then(users => {
                        var user = users[0];

                        if (!user || !user.eula) {
                            return { chat_id: chat_id, err: 'EULA' }
                        }

                        var isITTMember = Argo.isITTMember(token);

                        return database.getLicense(token)
                            .then(licenses => {
                                var license = licenses[0];

                                //! BETA token pre-open free for all
                                //! this is legacy code which has to be removed ASAP
                                if (!license) {
                                    license = {
                                        plan: 'beta',
                                        code: token,
                                        created: Date.now(),
                                        redeemed: false
                                    }

                                    if (Argo.isValidSubscriptionToken(token))
                                        database.upsertLicense(license).then(() => console.log(`License ${token} added`));
                                }

                                // User already subscribed with this token
                                if (license.redeemed) {
                                    return { chat_id: chat_id, err: 'You already redeemed this token!' }
                                }

                                var verified = Argo.subscription.verify(license);
                                var isValidToken = isITTMember || verified;
                                //! Check subscription.date too!!!!

                                var settings = {};
                                if (isValidToken) {
                                    user.updateToken(token);
                                    settings.is_ITT_team = isITTMember;
                                    if (isITTMember) {
                                        settings.subscription_plan = 100
                                        user.updateSettings(settings);
                                        return user;
                                    }
                                    else {
                                        return database.getAccessLevelFromPlan(license.plan).then(accessLevel => {
                                            settings.subscription_plan = accessLevel
                                            user.updateSettings(settings);
                                            return user;
                                        })
                                    }
                                }
                                return { chat_id: chat_id, err: 'Token is invalid.' }
                            })
                    })
                }
            })
            .catch(reason => console.log(reason));
    },
    getSignalPlans: () => {
        return Plan.find({});
    },
    getPlanFor: (signal) => {
        return Plan.find({ 'signals': signal })
            .then(plans => { return plans[0] })
    },
    getAccessLevelFromPlan: async (plan) => {
        var dbPlan = await Plan.find({ 'plan': plan })
        if (dbPlan)
            return dbPlan[0].accessLevel
        return -1
    },
    upsertLicense: (license) => {
        return License.update({ code: license.code }, license, { upsert: true, setDefaultsOnInsert: true });
    },
    getLicense: (token) => {
        return License.find({ code: token })
    },
    redeem: (token) => {
        return License.update({ code: token }, { redeemed: true })
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
