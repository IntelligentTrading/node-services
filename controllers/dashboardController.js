var historyCtrl = require('./historyController')
var tradingAlertsCtrl = require('./tradingAlertsController')
var usersCtrl = require('./usersController')
var signalDispatchingUtil = require('../util/signalDispatchingUtils')
var dateUtils = require('../util/dates')
var dataManager = require('../dashboard/data/dataManager')
var dashboardSecurity = require('../dashboard/util/checkTelegramSignature')
var moment = require('moment')
var _ = require('lodash')

module.exports = {
    load: (request, response) => {
        //ad auth
        var opts = { page_size: 100 }
        var free = {
            source: 0, transaction_currencies: 'BTC+ETH+BCH+XMR+ZEC+DASH+LTC',
            counter_currency: 2, trend: 1, page_size: 200,
            startdate: moment().add(-7, "days").format(),
            end: moment().format()
        }

        return Promise.all([tradingAlertsCtrl.getAll(), historyCtrl.getSignalHistory(opts), usersCtrl.getUsers(), historyCtrl.getSignalHistory(free)])
            .then((results) => {
                var history = JSON.parse(results[1])
                var analysisPromises = []
                history.results.forEach(record => {
                    analysisPromises.push(signalDispatchingUtil.analyze(record).then((isForPlanResults) => {
                        record.isForPlan = isForPlanResults
                    }))
                })

                var users = results[2]
                var userData = dataManager.buildUserData(users)
                var freeSignalsHistory = JSON.parse(results[3]).results

                return Promise.all(analysisPromises).then(() => {
                    var mostRecentSignal = _.sortBy(history.results, 'timestamp')[0]
                    var mostRecentFreeSignal = freeSignalsHistory.find(fsh => ["RSI", "kumo_breakout"].indexOf(fsh.signal) >= 0)
                    history.timeFromLastSignal = moment(mostRecentSignal.timestamp).fromNow()
                    history.signalHealth = Math.abs(moment(mostRecentSignal.timestamp).diff(moment(), 'hours')) <= 2
                    history.timeFromLastFreeSignal = moment(mostRecentFreeSignal.timestamp).fromNow()
                    history.freeSignalHealth = Math.abs(moment(mostRecentFreeSignal.timestamp).diff(moment(), 'hours')) <= 8

                    // I start from 5 because sometimes my user ID has misconfiguration for debugging or dev purposes and it might give a false positive
                    // In any case, the number of rejections should be > 10 to be meaningful
                    var lastSignalWithRejections = _.last(results[0].filter(ta => ta.rejections.length > 5))
                    history.lastTradingAlertWithRejectionsLabel = lastSignalWithRejections ? `ID:${lastSignalWithRejections.signalId}, Rejections: ${lastSignalWithRejections.rejections.length}` : 'N/A'

                    return { login: loginData(request), history: history, tradingAlerts: results[0], users: userData }
                })
            })
    },
    auth: (request, response, next) => {
        if (!dashboardSecurity.isSignatureValid(request.query)) {
            Promise.resolve(false)
        }

        return usersCtrl.getUser(request.query.id).then(user => {
            return user.settings.is_ITT_team
        }).catch(() => {
            return false
        })
    }
}

var loginData = (req) => {
    return {
        first_name: req.query.first_name,
        avatar: req.query.photo_url
    }
}