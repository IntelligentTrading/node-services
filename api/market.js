var _ = require('lodash')
var marketCap = require('./marketcap')
var core = require('../api/core')
var cache = require('../cache').redis
var moment = require('moment')

function getMarketCapTickers() {
    return cache.getAsync('marketCapTickers').then(marketCapTickers => {
        if (marketCapTickers)
            return Promise.resolve(JSON.parse(marketCapTickers))
        else {
            return marketCap.assets()
                .then(newMarketCapTickers => {
                    cache.set('marketCapTickers', JSON.stringify(newMarketCapTickers))
                    var expdate = moment().add(24, 'hours').unix()
                    cache.expireat('marketCapTickers', expdate)
                    return newMarketCapTickers
                })
        }
    })
}

function cacheInitialization() {
    return getMarketCapTickers().then(tkrs => {
        console.log('Tickers info cache initialized...');
        return self.tickers().then(() => {
            console.log('Tickers cache initialized...');
        })
    })
}

cacheInitialization().then(() => console.log('Market cache initialized'))

var self = module.exports = {
    tickers: (symbol) => {
        return cache.getAsync('tickers').then((tickers) => {
            if (tickers) {
                var tickers = JSON.parse(tickers)
                var result = symbol ? tickers.filter(v => v.symbol == symbol) : tickers
                return Promise.resolve(result)
            } else {
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

                    return Promise.all(tickerPromises).then((marketCapTickers) => {
                        marketCapTickers.forEach(coinMarketCapTicker => {
                            if (coinMarketCapTicker)
                                tkrs_info.push(coinMarketCapTicker)
                        })
                        cache.set('tickers', JSON.stringify(tkrs_info))
                        var expdate = moment().add(24, 'hours').unix()
                        cache.expireat('tickers', expdate)
                        return tkrs_info
                    })
                })
            }
        })
    },
    tickerInfo: (ticker) => {

        return getMarketCapTickers().then(marketCapTickers => {

            if (!ticker || !ticker.symbol)
                throw new Error('Ticker cannot be null')

            var matchingTickers = marketCapTickers
                .filter(coinMarketCapTicker => coinMarketCapTicker.symbol == ticker.symbol);

            if (matchingTickers.length <= 0) {
                matchingTickers = marketCapTickers
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
    itt: () => {
        return core.get('/itt')
    },
    init: () => {
        return cacheInitialization()
    }
}