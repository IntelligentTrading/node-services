var dbapi = require('../api/db').database

module.exports = {
    getPlans: (req, res) => {
        dbapi.getSignalPlans(req.params.signal).then(signal_plans => {
            res.send(signal_plans)
        }).catch(reason => {
            console.log(reason)
            res.sendStatus(500)
        });
    }
}