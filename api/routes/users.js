var express = require('express')
var router = express.Router()
var usersCtrl = require('../../controllers/usersController')
var solve = require('./solver')


router.post('/', (req, res) => {
    solve(usersCtrl.createUser(req.body), res)
})
router.get('/:telegram_chat_id?', (req, res) => {
    var telegram_chat_id = req.params.telegram_chat_id
    if (telegram_chat_id)
        solve(usersCtrl.getUser(telegram_chat_id), res)
    else
        solve(usersCtrl.getUsers(req.query), res)
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
router.get('/template/:label', (req, res) => {
    solve(usersCtrl.getSubscriptionTemplate(req.params.label), res)
})

module.exports = router