var historyCtrl = require('./historyController')
var tradingAlertsCtrl = require('./tradingAlertsController')
var usersCtrl = require('./usersController')
var signalDispatchingUtil = require('../util/signalDispatchingUtils')
var dateUtils = require('../util/dates')
var dataManager = require('../dashboard/data/dataManager')
var dashboardSecurity = require('../dashboard/util/checkTelegramSignature')
var _ = require('lodash')

module.exports = {
    load: (request, response) => {
        //ad auth
        var opts = { page_size: 100 }

        return Promise.all([tradingAlertsCtrl.getAll(), historyCtrl.getSignalHistory(opts), usersCtrl.getUsers()])
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

                return Promise.all(analysisPromises).then(() => {
                    var recent = history.results[0]
                    history.hoursFromLastSignal = hoursSinceLastSignal(recent)
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
    },
    broadcast: (request, response, next) => {
        
    }
}

var hoursSinceLastSignal = (signal) => {
    return (dateUtils.getDaysLeftFrom(signal.timestamp) * -24).toFixed(1)
}


var loginData = (req) => {
    return {
        first_name: req.query.first_name,
        avatar: req.query.photo_url
    }
}