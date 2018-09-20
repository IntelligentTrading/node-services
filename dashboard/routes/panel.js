var express = require('express')
var router = express.Router()
var dashboardCtrl = require('../../controllers/dashboardController')
var solve = require('../../util/solver')

router.get('/', (req, res) => {
    console.log('[Dashboard] Downloading data...')
    dashboardCtrl.load(req).then(data => {
        console.log('[Dashboard] Rendering data...')
        res.render('panel', data)
    }).catch((err) => {
        console.log(err)
        res.render('error')
    })
})

module.exports = router