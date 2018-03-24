var express = require('express')
var router = express.Router()
var panicCtrl = require('../../controllers/panicController')
var solve = require('./solver')

router.post('/', (req, res) => {
    solve(panicCtrl.saveNewsFeed(req.body), res)
})


router.put('/', (req, res) => {
    solve(panicCtrl.updateNewsFeed(req.body), res)
})

module.exports = router