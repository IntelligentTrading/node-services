var express = require('express')
var router = express.Router()
var licenseCtrl = require('../../controllers/licenseController')
var solve = require('./solver')

router.post('/generate/:subscriptionPlan', (req, res) => {
    solve(licenseCtrl.generateLicense(req.params.subscriptionPlan), res)
})

//body {licenseCode: token, telegram_chat_id: chat_id }
router.post('/subscribe', (req, res) => {
    solve(licenseCtrl.subscribe(req.body.licenseCode, req.body.telegram_chat_id), res)
})

module.exports = router