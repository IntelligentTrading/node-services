var express = require('express')
var router = express.Router()
var broadcastCtrl = require('../../controllers/broadcastController')
var solve = require('../../util/solver')

router.post('/broadcast', (req, res) => {
    var msg = req.body.message
    var deliverTo = req.body.cbITT ? { plan: "ITT" } : { plan: Object.getOwnPropertyNames(req.body).filter(p => p.startsWith("cb")).map(p => req.body[p]).join(",") }
    broadcastCtrl.broadcast(msg, deliverTo).then(() => { res.json({ success: true }) })
})

module.exports = router