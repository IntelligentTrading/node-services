var express = require('express')
var router = express.Router()
var walletCtrl = require('../../controllers/walletController')

router.get('/address/:telegram_chat_id', (req, res) => {
    res.send(walletCtrl.getWalletAddressFor(req.params.telegram_chat_id))
})

//! returning the wallet which contains the private key is a bad idea
router.get('/:telegram_chat_id', (req, res) => {
    res.send(walletCtrl.getWalletFor(req.params.telegram_chat_id))
})

module.exports = router