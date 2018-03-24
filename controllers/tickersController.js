var marketApi = require('../api/market')

module.exports = {
    tickers: (symbol) => {
        if (!symbol)
            return marketApi.tickers()
        else
            return marketApi.ticker(symbol)
    },
    counterCurrencies: () => {
        return marketApi.counterCurrencies()
    }
}