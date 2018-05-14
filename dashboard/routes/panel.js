var express = require('express')
var router = express.Router()
var dashboardCtrl = require('../../controllers/dashboardController')
var solve = require('../../util/solver')

router.get('/', (req, res) => {
    dashboardCtrl.load(req).then(data => {
        res.render('panel', data)
    }).catch((err) => {
        console.log(err)
        res.render('error')
    })
})

module.exports = router