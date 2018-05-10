var historyCtrl = require('./historyController')
var tradingAlertsCtrl = require('./tradingAlertsController')
var usersCtrl = require('./usersController')
var signalDispatchingUtil = require('../util/signalDispatchingUtils')
var dateUtils = require('../util/dates')
var _ = require('lodash')

module.exports = {
    render: (request, response) => {
        //ad auth
        var opts = { page_size: 100 }

        Promise.all([tradingAlertsCtrl.getAll(), historyCtrl.getSignalHistory(opts), usersCtrl.getUsers()]).then((results) => {
            var history = JSON.parse(results[1])
            var analysisPromises = []
            history.results.forEach(record => {
                analysisPromises.push(signalDispatchingUtil.analyze(record).then((isForPlanResults) => {
                    record.isForPlan = isForPlanResults
                }))
            })

            var users = results[2]
            users.map(user => {
                var currentPlan = { plan: 'FREE', exp: user.settings.subscriptions.free }
                if (dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0) {
                    currentPlan.plan = 'PAID'
                    currentPlan.exp = user.settings.subscriptions.paid
                }
                else if (dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0) {
                    currentPlan.plan = 'BETA'
                    currentPlan.exp = user.settings.subscriptions.beta
                }

                user.currentPlan = currentPlan
            })

            var oneWeekAgo = new Date()
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
            var oneMonthAgo = new Date()
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
            users.oneWeekOldUsers = users.filter(user => user.created > oneWeekAgo).length
            users.oneMonthOldUsers = users.filter(user => user.created > oneMonthAgo).length
            users.oneMonthOldTier1Users = users.filter(user => dateUtils.hasValidSubscription(user) && user.created > oneMonthAgo).length

            Promise.all(analysisPromises).then(() => {
                var recent = history.results[0]
                history.hoursFromLastSignal = hoursSinceLastSignal(recent)
                response.render('history', { history: history, tradingAlerts: results[0], users: users })
            })
        })
    },
    auth: (request, response, next) => {
        return usersCtrl.getUser(request.query.id).then(user => {
            return user.settings.is_ITT_team
        }).catch(() => {
            return false
        })
    }
}

var hoursSinceLastSignal = (signal) => {
    return (dateUtils.getDaysLeftFrom(signal.timestamp) * -24).toFixed(1)
}
