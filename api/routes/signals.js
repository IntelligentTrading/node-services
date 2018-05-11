var express = require('express')
var router = express.Router()
var signalsCtrl = require('../../controllers/signalsController')
var solve = require('../../util/solver')

router.get('/:signal?', (req, res) => {
    solve(signalsCtrl.getSignals(req.params.signal), res)
})

module.exports = router