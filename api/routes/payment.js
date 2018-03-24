var express = require('express')
var router = express.Router()
var paymentCtrl = require('../../controllers/paymentController')
var solve = require('../routes/solver')

router.post('/verify', (req, res) => {
    solve(paymentCtrl.verifyTx(req.body.txHash, req.body.telegram_chat_id), res)
})

router.get('/status/:telegram_chat_id', (req, res) => {
    solve(paymentCtrl.getUserStatus(req.params.telegram_chat_id), res)
})

module.exports = router