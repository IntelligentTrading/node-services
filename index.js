var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');

//API
var marketApi = require('./api/market').api;
var dbApi = require('./api/db').database;

//Controllers
var tickerController = require('./controllers/tickersController')
var panicController = require('./controllers/panicController')
var feedbackController = require('./controllers/feedbackController')

//UTILS
var Argo = require('./util/argo').argo;
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');


//BOT
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const markdown_opts = {
    parse_mode: "Markdown"
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use('/api', function (req, res, next) {
    if (!isAuthorized(req))
        res.sendStatus(401);
    else
        next();
});

app.set('view engine', 'ejs');

app.set('port', (process.env.PORT || 5002));

app.get('/', function (request, response) {
    response.sendStatus(200);
});

app.get('/eula', function (request, response) {
    var chat_id = request.query.u;
    var eula_url = `/eula_confirm?u=${chat_id}`;
    response.render('eula', { eula_url: eula_url });
});

app.get('/eula_confirm', function (request, response) {
    var chat_id = request.query.u;

    return dbApi.findUserByChatId(chat_id)
        .then(userMatches => {

            if (!userMatches || userMatches.length > 0) {
                return null;
            }
            else {

                return marketApi.tickers().then(tkrs => {
                    var tickersSymbols = tkrs.map(tkr => tkr.symbol);
                    var ccs = marketApi.counterCurrencies();

                    var settings = {
                        counter_currencies: [0, 2],//ccs.map(cc => ccs.indexOf(cc)), // BTC and USDT only
                        transaction_currencies: tickersSymbols,
                        horizon: 'medium',
                        is_muted: false,
                        is_crowd_enabled: true,
                        is_ITT_team: false,
                        subscription_plan: 0
                    }

                    var document = {
                        telegram_chat_id: chat_id,
                        eula: true,
                        settings: settings
                    }

                    return dbApi.addUser(document)
                })
            }
        })
        .then((newUser) => {
            response.render('eula_done');
            if (newUser)
                return 'Thanks for accepting EULA, you can now subscribe with `/token user_token` or keep using the bot with the free plan.';
            else
                return 'You already accepted the EULA, you can now subscribe with `/token user_token` or keep using the bot with the free plan.';
        }).then(eula_message => {
            var opts =
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{
                            "text": "Yes",
                            "callback_data": "wizard.NAV:RUN_true"
                        },
                        {
                            "text": "No",
                            "callback_data": "wizard.NAV:RUN_false"
                        }]]
                    }
                }
            bot.sendMessage(chat_id, eula_message, markdown_opts).then(() => {
                bot.sendMessage(chat_id, '💡*Hint*\nWe can walk through few configuration steps or you can do it using a /wizard. Do you wanna do it now?', opts);
            })
        }).catch(reason => {
            bot.sendMessage(chat_id, 'Something went wrong while accepting EULA, please retry or contact us!');
            console.log(reason)
        })
});

// Tickers API
app.get('/api/tickers', tickerController.tickers)
app.get('/api/ticker', tickerController.ticker);
app.get('/api/counter_currencies', tickerController.counterCurrencies)

// CryptoPanic API
app.put('/api/panic', panicController.updateNewsFeed)
    .post('/api/panic', panicController.saveNewsFeed)

// Feedback API
app.post('/api/feedback', feedbackController.addFeedback);

// users api

app.route('/api/users')
    .get((req, res) => {
        dbApi.getUsers(req.query).then(users => {
            res.send(users);
        })
            .catch(reason => res.sendStatus(500).send(reason));
    })
    .post((req, res) => {

        dbApi.addUser(req.body, res)
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
    });

app.route('/api/users/subscribe')
    .post((req, res) => {
        dbApi.subscribeUser(req.body.telegram_chat_id, req.body.token)
            .then(validationResult => {

                if (validationResult.err) {
                    res.send(validationResult);
                }
                else {
                    dbApi.redeem(req.body.token)
                        .then(redeemed => {
                            res.send(validationResult);
                        })
                }
            })
            .catch(reason => {
                console.log(reason);
                res.sendStatus(500)
            })
    })

app.route('/api/users/:id')
    .get((req, res) => {
        dbApi.findUserByChatId(req.params.id).then(user => {

            if (user.length <= 0)
                res.send({});
            else
                res.send(user[0]);
        }).catch(reason => res.status(500).send(reason));
    })
    .put((req, res) => {
        dbApi.updateUserSettings(req.params.id, req.body).then(user => {
            return res.status(200).send(user);
        }).catch(reason => {
            if (reason.code == 11000 && reason.name === 'MongoError') {
                return res.status(500).send('Duplicate Chat Id');
            }
            return res.status(500).send(reason)
        });
    })
    .delete((req, res) => {
        dbApi.deleteUser(req.params.id).then(user => {
            res.send(user[0]);
        }).catch(reason => res.status(500).send(reason));
    })

app.route('/api/users/:id/transaction_currencies').
    put((req, res) => {
        dbApi.updateUserTransactionCurrencies(req.params.id, req.body)
            .then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    });

app.route('/api/users/:id/counter_currencies').
    put((req, res) => {
        dbApi.updateUserCounterCurrencies(req.params.id, req.body)
            .then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    });

app.route('/api/users/:id/timezone').
    put((req, res) => {
        dbApi.updateUserSettings(req.params.id, req.body)
            .then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    });

//! Refactoring !!!
app.route('/api/users/:id/select_all_signals')
    .put((req, res) => {

        return dbApi.findUserByChatId(req.params.id)
            .then(users => {
                var user = users[0]
                return Promise.all([users[0], marketApi.tickers()])
            })
            .then(results => {
                var user = results[0];
                var tkrs = results[1];
                var tickersSymbols = tkrs.map(tkr => tkr.symbol);
                var ccs = marketApi.counterCurrencies();

                return {
                    settings: {
                        counter_currencies: [0, 2],//ccs.map(cc => ccs.indexOf(cc)), // BTC and USDT only
                        transaction_currencies: tickersSymbols,
                        horizon: user.settings.horizon,
                        is_muted: user.settings.is_muted,
                        is_crowd_enabled: user.settings.is_crowd_enabled,
                        risk: user.settings.risk,
                        is_ITT_team: user.settings.is_ITT_team,
                        time_diff: user.settings.time_diff,
                        timezone: user.settings.timezone,
                        subscription_plan: user.settings.subscription_plan
                    }
                }
            })
            .then(data => {
                return dbApi.upsertUser(req.params.id, data)
            }).then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    })

app.route('/api/users/generate/:subscriptionPlan')
    .post((req, res) => {
        var subscriptionPlan = req.params.subscriptionPlan;
        if (Argo.isITTMember(req.body.token)) {
            var licenseCode = Argo.subscription.generate(subscriptionPlan);
            dbApi.upsertLicense(licenseCode)
                .then(result => {
                    res.send(licenseCode)
                })
        }
        else {
            res.sendStatus(403);
        }
    })


app.route('/api/plans')
    .get((req, res) => {
        dbApi.getSignalPlans().then(signal_plans => {
            console.log(signal_plans);
            res.send(signal_plans)
        }).catch(reason => {
            console.log(reason)
            res.sendStatus(500)
        });
    })

app.route('/api/plans/:signal')
    .get((req, res) => {
        dbApi.getPlanFor(req.params.signal).then(signal_plan => {
            res.send(signal_plan)
        }).catch(reason => {
            console.log(reason)
            res.sendStatus(500)
        });
    })

app.route('/api/broadcast').
    post((req, res) => {
        dbApi.getUsers({}).then(users => {

            var slices = Math.ceil(users.length / 20);

            var broadcast_markdown_opts = {
                parse_mode: "Markdown"
            }

            var replaceables = req.body.replace;

            if (req.body.buttons) {
                var keyboard = [];
                var kb_btns = [];
                req.body.buttons.forEach(btn => kb_btns.push(btn));
                broadcast_markdown_opts.reply_markup = {
                    inline_keyboard: [kb_btns]
                }
            }

            for (current_slice = 0; current_slice < slices; current_slice++) {
                users.slice(current_slice * 20, 20 * (current_slice + 1) - 1)
                    .forEach(user => {
                        var final_message = "";

                        replaceables.forEach(replaceable => {
                            final_message = req.body.text.replace(replaceable.key, user[replaceable.value])
                        })

                        bot.sendMessage(user.telegram_chat_id, final_message, broadcast_markdown_opts)
                            .then(console.log(`${user.telegram_chat_id} ok`))
                            .catch(reason => console.log(`${user.telegram_chat_id}:${reason}`));
                    })
            }
        })
            .then(result => res.send(200))
            .catch(reason => { console.log(reason); res.send(500) })
    })

app.listen(app.get('port'), function () {

    marketApi.init()
        .then(() => {
            console.log('ITT Node Service is running on port', app.get('port'));
            app.emit('appStarted');
        })
        .catch((reason) => {
            console.log(reason)
        });
});

var isAuthorized = (request) => {
    var nsvc_api_key = request.header('NSVC-API-KEY');
    return nsvc_api_key == process.env.NODE_SVC_API_KEY;
}


module.exports = app;