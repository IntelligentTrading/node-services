var ccxt = require('ccxt');
var NodeCache = require('node-cache');
var cache = new NodeCache();
var _ = require('lodash');
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
                var poloniex_ticker_symbols_dup = Object.keys(poloniex_tickers).map(poloniex_ticker => poloniex_ticker.split('/')[0]);
                var poloniex_ticker_symbols = _.uniq(poloniex_ticker_symbols_dup);

                poloniex_ticker_symbols.forEach(poloniex_ticker_symbol => {

                    var tickerInfo = api.ticker(poloniex_ticker_symbol);

                    if (tickerInfo)
                        poloniex_symbols_info.push(tickerInfo)

                })
                cache.set('tickers', poloniex_symbols_info)
                return poloniex_symbols_info;
            })
        }


    },
    ticker: (symbol) => {
        var tickersInfo = cache.get('tickersInfo');

        var matchingTickers = tickersInfo.filter(tickerInfo => tickerInfo.symbol == symbol);

        if (matchingTickers.length > 0)
            return matchingTickers[0]
        else {
            matchingTickers = tickersInfo.filter(tickerInfo => tickerInfo.name == symbol);
            if (matchingTickers.length > 0)
                return matchingTickers[0]
        }

        throw new Error(`${symbol} Tickers Info not found`);
    },
    tickersInfo: async () => {
        var tickersInfo = cache.get('tickersInfo');
        if (tickersInfo == null || tickersInfo == undefined) {
            tickersInfo = await coinmarketcap.fetchAllTickers();
        }

        return tickersInfo;
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
    init: async (forceReload) => {

        if (forceReload)
            console.log('Forcing cache info reload...');

        var tickersInfo;
        while (!tickersInfo) {
            tickersInfo = await api.tickersInfo();
        }
        cache.set('tickersInfo', tickersInfo);

        console.log('Tickers info cache initialized...');

        return api.tickers(forceReload)
            .then(() => {
                console.log('Tickers cache initialized...');
            })
    }
}

exports.api = api;