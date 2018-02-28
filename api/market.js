var ccxt = require('ccxt');
var NodeCache = require('node-cache');
var cache = new NodeCache();
var _ = require('lodash');
var coinmarketcap = require('./coinmarketcap').coinmarketcap;
var poloniex = new ccxt.poloniex();

var self = module.exports = {
    tickers: (forceReload) => {
        var values = cache.get('tickers');

        if (values != undefined && !forceReload) {
            return new Promise((resolve, reject) => resolve(values));
        }
        else {
            return poloniex.fetchTickers().then((poloniex_tickers) => {
                var poloniex_symbols_info = [];
                var poloniex_ticker_symbols_dup = Object.keys(poloniex_tickers).map(poloniex_ticker => poloniex_ticker.split('/')[0]);
                var poloniex_ticker_symbols = _.uniq(poloniex_ticker_symbols_dup);

                var tickerPromises = [];
                poloniex_ticker_symbols.forEach(poloniex_ticker_symbol => {

                    var newTickerPromise = self.ticker(poloniex_ticker_symbol)
                        .then(coinMarketCapTicker => {
                            if (coinMarketCapTicker)
                                poloniex_symbols_info.push(coinMarketCapTicker)
                        })
                    tickerPromises.push(newTickerPromise)
                })

                return Promise.all(tickerPromises)
                    .then(() => {
                        cache.set('tickers', poloniex_symbols_info)
                        return poloniex_symbols_info;
                    })
            })
        }
    },
    ticker: (symbol) => {

        return getCoinMarketCapTickers().then(coinMarketCapTickers => {

            if (!symbol)
                throw new Error('Ticker symbol cannot be null')

            var matchingTickers = coinMarketCapTickers
                .filter(coinMarketCapTicker => coinMarketCapTicker.symbol == symbol);

            if (matchingTickers.length > 0)
                return matchingTickers[0]
            else {
                matchingTickers = coinMarketCapTickers
                    .filter(coinMarketCapTicker => coinMarketCapTicker.name == symbol);

                if (matchingTickers.length > 0)
                    return matchingTickers[0]
            }

            throw new Error(`${symbol} Tickers Info not found`);
        })
    },
    counterCurrencies: () => {
        var counter_currencies = [
            {
                "symbol": "BTC",
                "enabled": true
            },
            {
                "symbol": "ETH",
                "enabled": false
            },
            {
                "symbol": "USDT",
                "enabled": true
            },
            {
                "symbol": "XMR",
                "enabled": false
            }
        ];

        return counter_currencies;
    },
    init: () => {

        return getCoinMarketCapTickers().then(tkrs => {
            console.log('Tickers info cache initialized...');
            return self.tickers().then(() => {
                console.log('Tickers cache initialized...');
            })
        })
    }
}

var getCoinMarketCapTickers = () => {
    var coinMarketCapTickers = cache.get('coinMarketCapTickers');

    if (coinMarketCapTickers)
        return new Promise((rs, rj) => rs(coinMarketCapTickers))

    return coinmarketcap.fetchAllTickers()
        .then(newcoinMarketCapTickers => cache.set('coinMarketCapTickers', newcoinMarketCapTickers));
}