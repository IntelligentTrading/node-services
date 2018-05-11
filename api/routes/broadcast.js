var express = require('express')
var router = express.Router()
var broadcastCtrl = require('../../controllers/broadcastController')
var solve = require('../../util/solver')

router.post('/', (req, res) => {
    solve(broadcastCtrl.broadcast(req.body.message), res)
})

module.exports = router