var historyCtrl = require('./historyController')
var tradingAlertsCtrl = require('./tradingAlertsController')
var signalDispatchingUtil = require('../util/signalDispatchingUtils')
var dateUtils = require('../util/dates')
var _ = require('lodash')

module.exports = {
    render: (request, response) => {
        //ad auth
        var opts = {}
        if (request.query.p) opts.cursor = request.query.p

        Promise.all([tradingAlertsCtrl.getAll(), historyCtrl.getSignalHistory(opts)]).then((results) => {
            var history = JSON.parse(results[1])
            var analysisPromises = []
            history.results.forEach(record => {
                analysisPromises.push(signalDispatchingUtil.analyze(record).then((isForPlanResults) => {
                    record.isForPlan = isForPlanResults
                }))
            })

            Promise.all(analysisPromises).then(() => {
                var recent = history.results[0]
                history.hoursFromLastSignal = hoursSinceLastSignal(recent)
                response.render('history', { history: history, tradingAlerts: results[0] })
            })
        })
    }
}

var hoursSinceLastSignal = (signal) => {
    return (dateUtils.getDaysLeftFrom(signal.timestamp) * -24).toFixed(1)
}
