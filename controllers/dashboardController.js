var historyCtrl = require('./historyController')
var tradingAlertsCtrl = require('./tradingAlertsController')
var signalDispatchingUtil = require('../util/signalDispatchingUtils')

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

            Promise.all(analysisPromises).then(() => response.render('history', { history: history, tradingAlerts: results[0] }))
        })
    }
}
