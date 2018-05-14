var historyCtrl = require('./historyController')
var tradingAlertsCtrl = require('./tradingAlertsController')
var usersCtrl = require('./usersController')
var signalDispatchingUtil = require('../util/signalDispatchingUtils')
var dateUtils = require('../util/dates')
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
                buildUserData(users)

                return Promise.all(analysisPromises).then(() => {
                    var recent = history.results[0]
                    history.hoursFromLastSignal = hoursSinceLastSignal(recent)
                    return { login: loginData(request), history: history, tradingAlerts: results[0], users: users }
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


var loginData = (req) => {
    return {
        first_name: req.query.first_name,
        avatar: req.query.photo_url
    }
}

var buildUserData = (users) => {
    var eula_users = users.filter(usr => usr.eula)
    eula_users.map(user => {
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

    var oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    var oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    var oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    eula_users.oneDayOldUsers = eula_users.filter(user => user.createdAt > oneDayAgo).length
    eula_users.oneWeekOldUsers = eula_users.filter(user => user.createdAt > oneWeekAgo).length
    eula_users.oneMonthOldUsers = eula_users.filter(user => user.createdAt > oneMonthAgo).length

    eula_users.oneDayOldFreeUsers = users.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneDayAgo).length
    eula_users.oneDayOldFreePlusUsers = users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneDayAgo).length
    eula_users.oneDayOldTier1Users = users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneDayAgo).length

    eula_users.oneMonthOldFreeUsers = users.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneMonthAgo).length
    eula_users.oneMonthOldFreePlusUsers = users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneMonthAgo).length
    eula_users.oneMonthOldTier1Users = users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneMonthAgo).length

    eula_users.oneWeekOldFreeUsers = users.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneWeekAgo).length
    eula_users.oneWeekOldFreePlusUsers = users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneWeekAgo).length
    eula_users.oneWeekOldTier1Users = users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneWeekAgo).length

    users.TotalMuted = users.filter(user => user.settings.is_muted).length
    users.TotalCryptoEnabled = users.filter(user => user.settings.is_crowd_enabled).length

    users.TotalShort = users.filter(user => user.settings.horizon == 'short').length
    users.TotalMedium = users.filter(user => user.settings.horizon == 'medium').length
    users.TotalLong = users.filter(user => user.settings.horizon == 'long').length

    users.TotalFree = users.filter(user => user.currentPlan.plan == "FREE").length
    users.TotalFreePlus = users.filter(user => user.currentPlan.plan == "BETA").length
    users.TotalTier1 = users.filter(user => user.currentPlan.plan == "PAID").length
}