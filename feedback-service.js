var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var api = require('./api/feedback').feedback;

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5003));

app.get('/', function (request, response) {
    response.sendStatus(200)
});

app.post('/feedback', function (req, res) {
    try {
        console.log('Trying to POST...');
        api.addFeedback(req.body)
            .then((feedback) => { return res.send(feedback) })
            .catch((reason) => {
                console.log(reason.message);
                return res.status(500).send(reason.message);
            });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500).send(err);
    }
});

app.listen(app.get('port'), function () {
    console.log('ITT Feedback Service is running on port', app.get('port'));
});