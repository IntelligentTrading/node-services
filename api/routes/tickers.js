var express = require('express')
var router = express.Router()
var tickersCtrl = require('../../controllers/tickersController')
var solve = require('./solver')

router.get('/transaction_currencies/:symbol?', (req, res) => {
    solve(tickersCtrl.tickers(req.params.symbol), res)
})

router.get('/counter_currencies', (req, res) => {
    solve(tickersCtrl.counterCurrencies(), res)
})

module.exports = router