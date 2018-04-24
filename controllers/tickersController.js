var marketApi = require('../api/market')

module.exports = {
    tickers: (symbol) => {
        return marketApi.tickers(symbol)
    },
    counterCurrencies: () => {
        return marketApi.counterCurrencies()
    },
    itt: () => {
        return marketApi.tickerInfo({ symbol: 'ITT' })
    }
}