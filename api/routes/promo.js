var express = require('express')
var router = express.Router()
var promoCtrl = require('../../controllers/promoController')
var solve = require('../../util/solver')

router.post('/apply', (req, res) => {
    solve(promoCtrl.apply(req.body.telegram_chat_id, req.body.code), res)
})

router.get('/:code', (req, res) => {
    solve(promoCtrl.get(req.params.code), res)
})

module.exports = router