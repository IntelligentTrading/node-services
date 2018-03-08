var express = require('express')
var path = require('path')
var app = express()
var bodyParser = require('body-parser')
var marketApi = require('./api/market')
var mongoose = require('mongoose')

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
var tickerController = require('./controllers/tickersController')
var panicController = require('./controllers/panicController')
var feedbackController = require('./controllers/feedbackController')
var usersController = require('./controllers/usersController')
var broadcastController = require('./controllers/broadcastController')
var plansController = require('./controllers/plansController')
var eulaController = require('./controllers/eulaController')
var licenseController = require('./controllers/licenseController')
var paymentController = require('./controllers/paymentController')
var twoFAController = require('./controllers/2FAController')

//UTILS
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

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

// API

// EULA
app.get('/eula', eulaController.render)
app.get('/eula_confirm', eulaController.confirm)

// Tickers API
app.get('/api/tickers', tickerController.tickers)
app.get('/api/ticker', tickerController.ticker)
app.get('/api/counter_currencies', tickerController.counterCurrencies)

// CryptoPanic API
app.route('/api/panic')
    .put(panicController.updateNewsFeed)
    .post(panicController.saveNewsFeed)

// Feedback API
app.post('/api/feedback', feedbackController.addFeedback)

// Users API
app.route('/api/users')
    .get(usersController.getUsers)
    .post(usersController.createUser)

app.route('/api/users/:id')
    .get(usersController.getUser)
    .put(usersController.updateUser)

app.put('/api/users/:id/currencies/:currenciesPairRole', usersController.updateUserCurrencies)
app.put('/api/users/:id/select_all_signals', usersController.selectAllSignals)

//License API
app.post('/api/license/generate/:subscriptionPlan', licenseController.generateLicense)

//body {licenseCode: token, telegram_chat_id: chat_id }
app.post('/api/license/subscribe', licenseController.subscribe)

app.get('/api/plans/:signal?', plansController.getPlans)

app.post('/api/broadcast', broadcastController.broadcast)

app.post('/api/payment/verify', paymentController.watchApi)
app.get('/api/payment/receipt/:txHash', paymentController.receiptApi)
app.get('/api/payment/status/:telegram_chat_id', paymentController.getUserStatusApi)

app.get('/api/security/2FA/generate/:telegram_chat_id', twoFAController.generateSecretApi)
app.get('/api/security/2FA/qr/:telegram_chat_id', twoFAController.getQRDataApi)
app.get('/api/security/2FA/verify', twoFAController.verifyApi)
app.get('/api/security/2FA/token/:telegram_chat_id', twoFAController.getTokenApi)

app.listen(app.get('port'), function () {

    marketApi.init()
        .then(() => {
            console.log('ITT Node Service is running on port', app.get('port'));
            app.emit('appStarted');
        })
        .catch((reason) => {
            console.log(reason)
        });
});

var isAuthorized = (request) => {
    var nsvc_api_key = request.header('NSVC-API-KEY');
    return nsvc_api_key == process.env.NODE_SVC_API_KEY;
}


module.exports = app;