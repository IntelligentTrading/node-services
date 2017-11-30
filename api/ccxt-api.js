var ccxt = require('ccxt');
var NodeCache = require('node-cache');
var cache = new NodeCache({ stdTTL: 28800 });

let coinmarketcap = new ccxt.coinmarketcap({ 'timeout': 20000 });

var api = {
    tickers: () => {
        var values = cache.get('tickers');

        if (values != undefined) {
            return new Promise((resolve, reject) => resolve(values));
        }

        return coinmarketcap.fetchTickers().then((tkrs) => {
            cache.set('tickers', tkrs, 14400);
            return tkrs;
        });
    },
    ticker: (symbol) => {
        var tkr = cache.get(`${symbol}`);

        if (tkr != undefined) return new Promise((resolve, reject) => resolve(tkr));

        return coinmarketcap.fetchTicker(`${symbol}/USD`).then((tkrs) => {
            cache.set(`${symbol}`, tkr, 14400);
            return tkr;
        });
    }
}

api.init = function () {
    api.tickers()
        .then(() => {
            console.log('Tickers cache initialized...');
        })
        .catch(reason => console.log(reason));
    api.ticker()
        .then(() => {
            console.log('Ticker cache initialized...');
        })
        .catch(reason => console.log(reason));
}

exports.api = api;