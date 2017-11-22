var ccxt = require('ccxt');
let coinmarketcap = new ccxt.coinmarketcap({ 'timeout': 20000 });

var api = {
    tickers: () => {
        return coinmarketcap.fetchTickers();
    },
    ticker: (symbol) => {
        return coinmarketcap.fetchTicker(`${symbol}/USD`);
    }
}

exports.api = api;