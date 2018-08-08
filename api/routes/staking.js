var express = require('express')
var router = express.Router()
var stakingCtrl = require('../../controllers/stakingController')
var solve = require('../../util/solver')

router.post('/wallet', (req, res) => {
    solve(stakingCtrl.addWallet(req.body.telegram_chat_id, req.body.wallet), res)
})
router.post('/verify', (req, res) => {
    solve(stakingCtrl.verify(req.body.telegram_chat_id, req.body.signature), res)
})
router.get('/forceRefresh/:telegram_chat_id', (req, res) => {
    if (req.params.telegram_chat_id)
        solve(stakingCtrl.refreshSingleStakingStatus(req.params.telegram_chat_id), res)
    else
        solve(stakingCtrl.refreshStakingStatus(), res)
})

module.exports = router