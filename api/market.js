var ccxt = require('ccxt')
var NodeCache = require('node-cache')
var cache = new NodeCache()
var _ = require('lodash')
var coinmarketcap = require('./coinmarketcap')
var poloniex = new ccxt.poloniex()
var core = require('../api/core')


var self = module.exports = {
    tickers: (symbol) => {
        var values = cache.get('tickers');

        if (values != undefined) {
            var result = symbol ? values.filter(v => v.symbol == symbol) : values
            return new Promise((resolve, reject) => resolve(result))
        }
        else {
            return core.get('/tickers/transaction-currencies').then(tkrsJSON => {
                var tkrs = JSON.parse(tkrsJSON)
                var tickerPromises = []
                var tkrs_info = []

                tkrs.forEach(tkr => {
                    //! this property 'rename' is dued to the model in the backend which uses transaction_currency
                    //! and not symbol, but in this context it becomes confusing
                    if (tkr.transaction_currency) tkr.symbol = tkr.transaction_currency
                    tickerPromises.push(self.tickerInfo(tkr))
                })

                return Promise.all(tickerPromises).then((coinMarketCapTickers) => {
                    coinMarketCapTickers.forEach(coinMarketCapTicker => {
                        if (coinMarketCapTicker)
                            tkrs_info.push(coinMarketCapTicker)
                    })
                    cache.set('tickers', tkrs_info)
                    return tkrs_info
                })
            })
        }
    },
    tickerInfo: (ticker) => {

        return getCoinMarketCapTickers().then(coinMarketCapTickers => {

            if (!ticker || !ticker.symbol)
                throw new Error('Ticker cannot be null')

            var matchingTickers = coinMarketCapTickers
                .filter(coinMarketCapTicker => coinMarketCapTicker.symbol == ticker.symbol);

            if (matchingTickers.length <= 0) {
                matchingTickers = coinMarketCapTickers
                    .filter(coinMarketCapTicker => coinMarketCapTicker.name == ticker.symbol);
            }
            if (matchingTickers.length > 0) {
                var matchingTicker = matchingTickers[0]
                matchingTicker.sources = ticker.exchange
                matchingTicker.counter_currencies = ticker.counter_currency

                return matchingTicker
            }
            console.log(`${ticker.symbol} info not found`);
        })
    },
    counterCurrencies: () => {
        return core.get('tickers/counter-currencies')
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