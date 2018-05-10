var express = require('express'),
    router = express.Router()
var app = express()

var fs = require('fs')
var path = require('path')
var marketApi = require('./api/market')
var blockchainSvc = require('./controllers/blockchainSniffer')
var config = require('./config')
var database = require('./database')
database.connect()
config.boot(app)

blockchainSvc.init()

var routerFiles = fs.readdirSync('./api/routes')
routerFiles.forEach(rf => {
    app.use(`/api/${rf.replace('.js', '')}`, require(`./api/routes/${rf}`))
})

//! EULA -> this will probably be deleted or changed
var eulaController = require('./controllers/eulaController')
app.get('/eula', eulaController.render)
app.get('/eula_confirm', eulaController.confirm)

var dashboardCtrl = require('./controllers/dashboardController')
app.all('/auth', (req, res, next) => res.render('login'))

app.use('/dashboard', function (req, res, next) {
    dashboardCtrl.auth(req).then((isAuthorized => {
        isAuthorized ? next() : res.redirect('/auth')
    })).catch(() => res.redirect('/auth'))
})
app.get('/dashboard/history', dashboardCtrl.render)

app.listen(app.get('port'), function () {

    marketApi.init()
        .then(() => {
            console.log('ITT Node Service is running on port', app.get('port'));
            app.emit('appStarted');
        })
        .catch((reason) => {
            console.log(reason)
        })
})

module.exports = app