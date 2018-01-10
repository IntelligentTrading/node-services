var rp = require('request-promise');

var cmc = {
    fetchAllTickers: () => {
        return rp('https://api.coinmarketcap.com/v1/ticker/?limit=0', { timeout: 20000 })
            .then(tickers => { return JSON.parse(tickers) })
    }
}

exports.coinmarketcap = cmc;
