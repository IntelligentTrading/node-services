var marketApi = require('../api/market')

module.exports = {
    tickers: (req, res) => {
        var promise = marketApi.tickers();
        solve(res, promise);
    },
    ticker: (req, res) => {
        var symbol = req.query.symbol;
        var promise = marketApi.ticker(symbol)
        solve(res, promise)
    },
    counterCurrencies: (req, res) => {
        var cc = marketApi.counterCurrencies();
        return res.send(cc);
    }
}

function solve(res, promise) {

    promise.then((response) => { res.status(200).send(response) })
        .catch((reason) => {
            console.log(reason.message);
            return res.status(500).send(reason.message);
        });
}