var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var market_api = require('./api/ccxt-api').api;
var feedback_api = require('./api/feedback').feedback;
var bot_api = require('./api/bot-api').bot_api;

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

app.use(bodyParser.json());

app.use('/api',function (req, res, next) {
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
    bot_api.eula(chat_id)
        .then(() => {
            bot.sendMessage(chat_id, 'Thanks for accepting EULA, you can now subscribe with /token user_token');
            response.render('eula_done');
        })
        .catch(reason => {
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
        return res.sendStatus(500).send(err);
    }
});

app.get('/api/tickersInfo', function (req, res) {
    try {
        var tInfo = market_api.tickersInfo();
        res.send(tInfo)
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500).send(err);
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
        return res.sendStatus(500).send(err);
    }
});

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
        return res.sendStatus(500).send(err);
    }
});

app.listen(app.get('port'), function () {
    market_api.init();
    console.log('ITT Node Service is running on port', app.get('port'));
});

var isAuthorized = (request) => {
    var nsvc_api_key = request.header('NSVC-API-KEY');
    return nsvc_api_key == process.env.NODE_SVC_API_KEY;
}