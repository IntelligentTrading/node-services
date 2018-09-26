var express = require('express')
var router = express.Router()
var solve = require('../../util/solver')
var subscriptionCtrl = require('../../controllers/subscriptionController')

router.get('/template/:label', (req, res) => {
    solve(subscriptionCtrl.getSubscriptionTemplate(req.params.label), res)
})

router.get('/', (req, res) => {
    solve(subscriptionCtrl.getSubscriptionTemplates(), res)
})

module.exports = router