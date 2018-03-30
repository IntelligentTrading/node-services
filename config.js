var bodyParser = require('body-parser')
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./docs/swagger.json');

var isAuthorized = (request) => {
    var nsvc_api_key = request.header('NSVC-API-KEY');
    return nsvc_api_key == process.env.NODE_SVC_API_KEY;
}

module.exports.boot = (app) => {
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
}