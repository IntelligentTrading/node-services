var express = require('express'),
    router = express.Router()
var app = express()

var fs = require('fs')
var path = require('path')
var marketApi = require('./api/market')
var config = require('./config')
var database = require('./database')

require('./controllers/blockchainSniffer').init()

database.connect()
config.boot(app)

var routerFiles = fs.readdirSync('./api/routes')
routerFiles.forEach(rf => {
    app.use(`/api/${rf.replace('.js', '')}`, require(`./api/routes/${rf}`))
})

//! EULA -> this will probably be deleted or changed
var eulaController = require('./controllers/eulaController')
app.get('/eula', eulaController.render)
app.get('/eula_confirm', eulaController.confirm)

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

module.exports = app;