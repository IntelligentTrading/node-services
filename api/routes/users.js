var express = require('express')
var router = express.Router()
var usersCtrl = require('../../controllers/usersController')
var solve = require('../../util/solver')

router.post('/', (req, res) => {
    solve(usersCtrl.createUser(req.body), res)
})
router.get('/', (req, res) => {
    solve(usersCtrl.all(req.query), res)
})
router.get('/:telegram_chat_id', (req, res) => {
    solve(usersCtrl.getUser(req.params.telegram_chat_id), res)
})
router.put('/:telegram_chat_id', (req, res) => {
    solve(usersCtrl.updateUser(req.params.telegram_chat_id, req.body), res)
})
router.put('/:telegram_chat_id/currencies/:currenciesPairRole', (req, res) => {
    solve(usersCtrl.updateUserCurrencies(req.params.telegram_chat_id, req.params.currenciesPairRole, req.body), res)
})
router.put('/:telegram_chat_id/select_all_signals', (req, res) => {
    solve(usersCtrl.selectAllSignals(req.params.telegram_chat_id), res)
})
router.put('/:telegram_chat_id/resetSignals', (req, res) => {
    solve(usersCtrl.resetSignals(req.params.telegram_chat_id), res)
})
router.post('/notified', (req, res) => {
    solve(usersCtrl.lastNotifiedSignal(req.body), res)
})
router.post('/referral', (req, res) => {
    solve(usersCtrl.checkReferral(req.body.telegram_chat_id, req.body.code), res)
})
router.put('/stop/:telegram_chat_id', (req, res) => {
    solve(usersCtrl.stop(req.params.telegram_chat_id, req.query.toggle.toLowerCase() === 'true'), res)
})
router.get('/promo/all', (req, res) => {
    solve(usersCtrl.getPromoUsers(), res)
})


module.exports = router