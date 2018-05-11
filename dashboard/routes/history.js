var express = require('express')
var router = express.Router()
var dashboardCtrl = require('../../controllers/dashboardController')
var solve = require('../../util/solver')

router.get('/', (req, res) => {
    dashboardCtrl.load(req).then(data => {
        res.render('history', data)
    }).catch(() => res.render('error'))
})

module.exports = router