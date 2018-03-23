var express = require('express')
var router = express.Router()
var plansCtrl = require('../../controllers/plansController')
var solve = require('./solver')

router.get('/:signal?', (req, res) => {
    solve(plansCtrl.getPlans(req.params.signal), res)
})

module.exports = router