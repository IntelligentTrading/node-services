var express = require('express'),
    router = express.Router()
var app = express()

var fs = require('fs')
var blockchainSvc = require('./controllers/blockchainSniffer')
var config = require('./config')
var database = require('./database')
database.connect()
config.boot(app)
app.use(express.static('public'))

var cacheService = require('./boot/cacheService')
blockchainSvc.init()

var apiRouterFiles = fs.readdirSync('./api/routes')
apiRouterFiles.forEach(rf => {
    app.use(`/api/${rf.replace('.js', '')}`, require(`./api/routes/${rf}`))
})

var dashboardRouterFiles = fs.readdirSync('./dashboard/routes')
dashboardRouterFiles.forEach(rf => {
    app.use(`/dashboard/${rf.replace('.js', '')}`, require(`./dashboard/routes/${rf}`))
})

//! EULA -> this will probably be deleted or changed
var eulaController = require('./controllers/eulaController')
app.get('/eula', eulaController.render)
app.get('/eula_confirm', eulaController.confirm)

app.listen(app.get('port'), function () {
    cacheService.load().then(() => {
        console.log('Cache loaded')
        console.log('ITF Node Services running on ' + app.get('port') + ' 🚀')
    })
})

module.exports = app