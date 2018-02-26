var dbapi = require('../api/db').database
var Plan = require('../models/Plan')

module.exports = {
    getPlans: (req, res) => {

        var signal = req.params.signal;
        var clause = {};

        if (signal)
            clause['signals'] = signal;

        Plan.find(clause)
            .then(plans => res.send(plans))
            .catch(reason => {
                res.status(500).send(reason)
            });
    }
}