var express = require('express')
var router = express.Router()
var usersCtrl = require('../../controllers/usersController')
var solve = require('./solver')

router.get('/:telegram_chat_id?', (req, res) => {
    solve(usersCtrl.getUsers(req.params.telegram_chat_id, req.query), res)
})
router.post('/:telegram_chat_id?', (req, res) => {
    solve(usersCtrl.createUser(req.params.telegram_chat_id, req.body), res)
})
router.put('/:telegram_chat_id?', (req, res) => {
    solve(usersCtrl.updateUser(req.params.telegram_chat_id, req.body), res)
})
router.put('/:telegram_chat_id/currencies/:currenciesPairRole', (req, res) => {
    solve(usersCtrl.updateUserCurrencies(req.params.telegram_chat_id, req.params.currenciesPairRole, req.body), res)
})
router.put('/:telegram_chat_id/select_all_signals', (req, res) => {
    solve(usersCtrl.selectAllSignals(req.params.telegram_chat_id), res)
})

module.exports = router