var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var market_api = require('./api/ccxt-api').api;
var feedback_api = require('./api/feedback').feedback;
var db_api = require('./api/db-api').database;

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const markdown_opts = {
    parse_mode: "Markdown"
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

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

    db_api.upsertUser(
        chat_id,
        {
            eula: true
        }).then(() => {
            bot.sendMessage(chat_id, 'Thanks for accepting EULA, you can now subscribe with /token user_token or keep using the bot if already subscribed.');
            response.render('eula_done');
        }).catch(reason => {
            bot.sendMessage(chat_id, 'Something went wrong while accepting EULA, please retry or contact us!');
            console.log(reason)
        });
});

app.get('/api/tickers', function (req, res) {
    try {
        market_api.tickers()
            .then((tickers) => { res.send(tickers) })
            .catch((reason) => {
                console.log(reason.message);
                return res.status(500).send(reason.message);
            });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});

app.get('/api/tickersInfo', function (req, res) {
    try {
        market_api.tickersInfo()
            .then((tInfo) => res.send(tInfo))
            .catch(error => {
                console.log(error)
                res.status(500).send(error);
            })
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});

app.get('/api/ticker', function (req, res) {
    try {
        var symbol = req.query.symbol;
        market_api.ticker(symbol)
            .then((ticker) => { res.send(ticker) })
            .catch((reason) => {
                console.log(reason.message);
                return res.status(500).send(reason.message);
            });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});

app.get('/api/counter_currencies', (req, res) => {
    var cc = market_api.counterCurrencies();
    return res.send(cc);
})

app.post('/api/feedback', function (req, res) {
    try {
        console.log('Trying to POST...');
        feedback_api.addFeedback(req.body)
            .then((card_result) => {
                return res.send(card_result)
            })
            .catch((reason) => {
                console.log(reason.message);
                return res.status(500).send(reason.message);
            });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send(err);
    }
});


// users api

app.route('/api/users')
    .get((req, res) => {
        db_api.getUsers(req.query).then(users => {
            res.send(users);
        })
            .catch(reason => res.sendStatus(500).send(reason));
    })
    .post((req, res) => {

        db_api.addUser(req.body, res)
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

app.route('/api/users/verify')
    .post((req, res) => {
        db_api.verifyUser(req.body.telegram_chat_id, req.body.token)
            .then(validationResult => {
                res.send(validationResult);
            })
            .catch(reason => {
                console.log(reason);
                res.sendStatus(500)
            })
    })

app.route('/api/users/:id')
    .get((req, res) => {
        db_api.findUserByChatId(req.params.id).then(user => {

            if (user.length <= 0)
                res.send({});
            else
                res.send(user[0]);
        }).catch(reason => res.status(500).send(reason));
    })
    .put((req, res) => {
        db_api.updateUserSettings(req.params.id, req.body).then(user => {
            return res.status(200).send(user);
        }).catch(reason => {
            if (reason.code == 11000 && reason.name === 'MongoError') {
                return res.status(500).send('Duplicate Chat Id');
            }
            return res.status(500).send(reason)
        });
    })
    .delete((req, res) => {
        db_api.deleteUser(req.params.id).then(user => {
            res.send(user[0]);
        }).catch(reason => res.status(500).send(reason));
    })

app.route('/api/users/:id/transaction_currencies').
    put((req, res) => {
        db_api.updateUserTransactionCurrencies(req.params.id, req.body)
            .then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    });

app.route('/api/users/:id/counter_currencies').
    put((req, res) => {
        db_api.updateUserCounterCurrencies(req.params.id, req.body)
            .then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    });

app.route('/api/users/:id/timezone').
    put((req, res) => {
        db_api.updateUserSettings(req.params.id, req.body)
            .then((user) => {
                res.send(user);
            }).catch(reason => {
                res.status(500).send(reason)
            });
    });

app.route('/api/broadcast').
    post((req, res) => {
        var users = db_api.getUsers({}).then(users => {

            var slices = Math.ceil(users.length / 20);

            var replaceables = req.body.replace;

            for (current_slice = 0; current_slice < slices; current_slice++) {
                users.slice(current_slice, 20 * (current_slice + 1))
                    .forEach(user => {
                        var final_message = "";

                        replaceables.forEach(replaceable => {
                            final_message = req.body.text.replace(replaceable.key, user[replaceable.value])
                        })

                        bot.sendMessage(user.telegram_chat_id, final_message, markdown_opts)
                            .then(console.log(`${user.telegram_chat_id} ok`))
                            .catch(reason => console.log(`${user.telegram_chat_id}:${reason}`));
                    })
            }
        })
            .then(result => res.send(200))
            .catch(reason => { console.log(reason); res.send(500) })
    })

app.route('/api/test/:id')
    .put((req, res) => {
        db_api.upsertUser(req.params.id, { eula: false })
            .then(result => { res.send(200) })
            .catch(reason => { console.log(reason); res.send(500) });
    })


app.listen(app.get('port'), function () {
    market_api.init();
    console.log('ITT Node Service is running on port', app.get('port'));
});

var isAuthorized = (request) => {
    var nsvc_api_key = request.header('NSVC-API-KEY');
    return nsvc_api_key == process.env.NODE_SVC_API_KEY;
}