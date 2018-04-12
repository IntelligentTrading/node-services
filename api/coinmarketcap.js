var rp = require('request-promise');

var cmc = {
    fetchAllTickers: () => {
        return rp('https://api.coinmarketcap.com/v1/ticker/?limit=0', { timeout: 30000 })
            .then(tickers => { return JSON.parse(tickers) })
    },
    fetchITT: () => {
        return rp('https://api.coinmarketcap.com/v1/ticker/intelligent-trading-tech/', { timeout: 30000 })
            .then(itt => { return JSON.parse(itt) })
    }
}

module.exports = cmc
