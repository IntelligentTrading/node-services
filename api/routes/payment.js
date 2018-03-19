var express = require('express')
var router = express.Router()
var paymentCtrl = require('../../controllers/paymentController')

router.post('/verify', (req, res) => {
    go(paymentCtrl.verifyTx(req.body.txHash, req.body.telegram_chat_id), res)
})

router.get('/status/:telegram_chat_id', (req, res) => {
    go(paymentCtrl.getUserStatus(req.params.telegram_chat_id), res)
})

var go = (promise, response) => {
    promise
        .then(result => response.send(result))
        .catch(err => {
            console.log(err)
            response.status(500).send(err.message)
        })
}

module.exports = router