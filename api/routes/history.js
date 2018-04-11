var express = require('express')
var router = express.Router()
var historyCtrl = require('../../controllers/historyController')
var solve = require('./solver')

router.get('/signals', (req, res) => {
    solve(historyCtrl.getSignalHistory(req.query), res)
})

module.exports = router