var ccxt = require('ccxt');
var NodeCache = require('node-cache');
var cache = new NodeCache();
var _ = require('lodash');

//let coinmarketcap = new ccxt.coinmarketcap({ 'timeout': 20000 });
var coinmarketcap = require('./coinmarketcap').coinmarketcap;
var poloniex = new ccxt.poloniex();

var api = {
    tickers: (forceReload) => {
        var values = cache.get('tickers');

        if (values != undefined && !forceReload) {
            return new Promise((resolve, reject) => resolve(values));
        }
        else {
            return poloniex.fetchTickers().then((poloniex_tickers) => {
                var poloniex_symbols_info = [];
                var promises = [];

                var poloniex_ticker_symbols_dup = Object.keys(poloniex_tickers).map(poloniex_ticker => poloniex_ticker.split('/')[0]);
                var poloniex_ticker_symbols = _.uniq(poloniex_ticker_symbols_dup);

                poloniex_ticker_symbols.forEach(poloniex_ticker_symbol => {

                    promises.push(api.ticker(poloniex_ticker_symbol)
                        .then(tickerInfo => {
                            if (tickerInfo)
                                poloniex_symbols_info.push(tickerInfo)
                        }).catch(reason => { console.log(reason) }));
                })

                return Promise.all(promises)
                    .then(() => {
                        cache.set('tickers', poloniex_symbols_info)
                        return poloniex_symbols_info;
                    })
            })
        }


    },
    ticker: (symbol) => {
        return new Promise((resolve, reject) => {

            var tickersInfo = cache.get('tickersInfo');
            var matchingTickers = tickersInfo.filter(tickerInfo => tickerInfo.symbol == symbol);

            if (matchingTickers.length > 0)
                resolve(matchingTickers[0])
            else {
                matchingTickers = tickersInfo.filter(tickerInfo => tickerInfo.name == symbol);
                if (matchingTickers.length > 0)
                    resolve(matchingTickers[0])
            }
            reject(`${symbol} Tickers Info not found`);
        });
    },
    tickersInfo: (forceReload) => {
        var tickersInfo = cache.get('tickersInfo');
        if (tickersInfo == null || tickersInfo == undefined || forceReload) {
            return coinmarketcap.fetchAllTickers().then((tkrs) => {
                cache.set('tickersInfo', tkrs);
                return tkrs;
            });
        }
        else {
            return new Promise((resolve, reject) => resolve(tickersInfo));
        }
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
    }
}

api.init = (forceReload) => {

    if (forceReload)
        console.log('Forcing cache info reload...');

    api.tickersInfo(forceReload)
        .then(() => {
            console.log('Tickers info cache initialized...');
            api.tickers(forceReload)
                .then(() => {
                    console.log('Tickers cache initialized...');
                })
                .catch(reason => console.log(reason));
        })
        .catch(reason => console.log(reason));
}

cache.on('expired', (key, value) => {
    console.log(`${key} expired, reloading cache...`);
    if (key == 'tickers')
        api.tickers().catch(reason => console.log(reason))
    if (key == 'tickersInfo')
        api.tickersInfo().catch(reason => console.log(reason))
});

exports.api = api;