var express = require('express')
var router = express.Router()
var tradingAlertsCtrl = require('../../controllers/tradingAlertsController')
var solve = require('../../util/solver')

router.post('/', (req, res) => {
    solve(tradingAlertsCtrl.addTradingAlert(req.body), res)
})

router.get('/rejections',(req,res)=>{
    solve(tradingAlertsCtrl.getLastRejected(), res)
})

module.exports = router