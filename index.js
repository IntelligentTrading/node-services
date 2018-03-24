var express = require('express'),
    router = express.Router()

var path = require('path')
var app = express()
var bodyParser = require('body-parser')
var marketApi = require('./api/market')
var mongoose = require('mongoose')
var fs = require('fs')

// Connect DB
var options = {
    useMongoClient: true,
    keepAlive: 300,
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500 // Reconnect every 500ms
}

mongoose.connect(process.env.MONGODB_URI, options);
mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected');
});

//Controllers
var eulaController = require('./controllers/eulaController')

//UTILS
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./docs/swagger.json');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/api', function (req, res, next) {
    if (!isAuthorized(req))
        res.sendStatus(401);
    else
        next();
})

app.set('view engine', 'ejs')
app.set('port', (process.env.PORT || 5002))
app.get('/', function (request, response) {
    response.sendStatus(200);
})

// Load dynamically routes and controllers
var routerFiles = fs.readdirSync('./api/routes')
routerFiles.forEach(rf => {
    app.use(`/api/${rf.replace('.js', '')}`, require(`./api/routes/${rf}`))
})

// EULA
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

var isAuthorized = (request) => {
    var nsvc_api_key = request.header('NSVC-API-KEY');
    return nsvc_api_key == process.env.NODE_SVC_API_KEY;
}

module.exports = app;