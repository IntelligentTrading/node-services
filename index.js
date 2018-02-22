var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');

//API
var dbApi = require('./api/db').database
var marketApi = require('./api/market').api

//Controllers
var tickerController = require('./controllers/tickersController')
var panicController = require('./controllers/panicController')
var feedbackController = require('./controllers/feedbackController')
var usersController = require('./controllers/usersController')
var broadcastController = require('./controllers/broadcastController')
var plansController = require('./controllers/plansController')
var eulaController = require('./controllers/eulaController')
var licenseController = require('./controllers/licenseController')

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

/*
    app.post('/api/users/subscribe', usersController.subscribeUser)
*/

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