var ccxt = require('ccxt');
var NodeCache = require('node-cache');
var cache = new NodeCache({ stdTTL: 6000, checkperiod: 6000 });

let coinmarketcap = new ccxt.coinmarketcap({ 'timeout': 20000 });

var api = {
    tickers: () => { 
        var values = cache.get('tickers');

        if (values != undefined) {
            return new Promise((resolve, reject) => resolve(values));
        }

        return coinmarketcap.fetchTickers().then((tkrs) => {
            var tickersInfo = initTickerInfoList(tkrs);
            cache.set('tickers', tkrs);
            cache.set('tickersInfo',tickersInfo)
            return tkrs;
        });
    },
    ticker: (symbol) => {
        var tkr = cache.get(`${symbol}`);
        if (tkr != undefined) return new Promise((resolve, reject) => resolve(tkr));
    },
    tickersInfo: () => {
        return cache.get('tickersInfo');
    }
}

var initTickerInfoList = (tickers) => {

    var tickerList = { tickers: [] };

    Object.keys(tickers).forEach(function (symbol) {
        var currency = {};
        var currentSymbolInfo = tickers[symbol].info;
        currency.symbol = currentSymbolInfo.symbol;
        currency.name = currentSymbolInfo.name;
        currency.rank = currentSymbolInfo.rank;

        tickerList.tickers.push(currency);
    });

    return tickerList;
}

api.init = function () {
    api.tickers()
        .then((tickers) => {
            console.log('Tickers cache initialized...');
        })
        .catch(reason => console.log(reason));
}

cache.on('expired', (key, value) => {
    key == 'tickers' ? api.tickers().catch(reason => console.log(reason)) : {};
});

exports.api = api;