var rp = require('request-promise');

var cmc = {
    fetchAllTickers: () => {
        return rp('https://api.coinmarketcap.com/v1/ticker/?limit=0', { timeout: 30000 })
            .then(tickers => { return JSON.parse(tickers) })
    }
}

module.exports = cmc
