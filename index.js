var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var api = require('./api/ccxt-api').api;

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5002));

app.get('/', function (request, response) {
    response.sendStatus(200)
});

app.get('/tickers', function (req, res) {
    try {
        api.tickers()
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

app.get('/ticker', function (req, res) {
    try {
        var symbol = req.query.symbol;
        api.ticker(symbol)
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

app.listen(app.get('port'), function () {
    console.log('ITT Node Service is running on port', app.get('port'));
});