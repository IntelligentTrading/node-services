var express = require('express')
var router = express.Router()
var twoFACtrl = require('../../controllers/2FAController')
var solve = require('./solver')

router.get('/generate/:telegram_chat_id', (req, res) => {
    solve(twoFACtrl.generateSecretFor(req.params.telegram_chat_id), res)
})
router.get('/verify', (req, res) => {
    solve(twoFACtrl.verify(req.query.telegram_chat_id, req.query.token), res)
})
router.get('/token/:telegram_chat_id', (req, res) => {
    solve(twoFACtrl.getToken(req.params.telegram_chat_id), res)
})


module.exports = router