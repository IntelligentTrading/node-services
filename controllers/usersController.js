var dbapi = require('../api/db').database
var marketapi = require('../api/market').api

module.exports = {
    getUsers: (req, res) => {
        dbapi.getUsers(req.query).then(users => {
            res.send(users);
        }).catch(reason => res.sendStatus(500).send(reason));
    },
    getUser: (req, res) => {
        dbapi.findUserByChatId(req.params.id).then(user => {
            user.length <= 0 ? res.sendStatus(404) : res.status(200).send(user[0])
        }).catch(reason => res.status(500).send(reason));
    },
    createUser: (req, res) => {
        dbapi.addUser(req.body, res)
            .then((newObject) => {
                if (newObject || newObject._id)
                    return res.status(201).send(newObject);
            })
            .catch((reason) => {
                console.log(reason.message);
                if (reason.code == 11000 && reason.name === 'MongoError') {
                    return res.status(500).send('Duplicate Chat Id');
                }
                return res.status(500).send(reason.message);
            });
    },
    subscribeUser: (req, res) => {

        dbapi.subscribeUser(req.body.telegram_chat_id, req.body.token)
            .then(validationResult => {

                if (validationResult.err) {
                    res.send(validationResult);
                }
                else {
                    dbapi.redeem(req.body.token)
                        .then(redeemed => {
                            res.send(validationResult);
                        })
                }
            })
            .catch(reason => {
                console.log(reason);
                res.sendStatus(500)
            })
    },
    updateUser: (req, res) => {
        dbapi.updateUserSettings(req.params.id, req.body).then(user => {
            return res.status(200).send(user);
        }).catch(reason => {
            if (reason.code == 11000 && reason.name === 'MongoError') {
                return res.status(500).send('Duplicate Chat Id');
            }
            return res.status(500).send(reason)
        })
    },
    updateUserCurrencies: (req, res) => {

        var currenciesPairRoles = ['transaction', 'counter']
        if (currenciesPairRoles.indexOf(req.params.currenciesPairRole) < 0) {
            res.status(404)
        }
        else {
            dbapi.updateUserCurrencies(req.params.id, req.body, req.params.currenciesPairRole)
                .then((user) => {
                    res.send(user);
                }).catch(reason => {
                    res.status(500).send(reason)
                })
        }
    },
    selectAllSignals: (req, res) => {

        return dbapi.findUserByChatId(req.params.id)
            .then(users => {
                var user = users[0]
                return Promise.all([users[0], marketapi.tickers(), marketapi.counterCurrencies()])
            })
            .then(results => {
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
                return dbapi.upsertUser(req.params.id, data)
            }).then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    }
}