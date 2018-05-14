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
                var userData = buildUserData(users)

                return Promise.all(analysisPromises).then(() => {
                    var recent = history.results[0]
                    history.hoursFromLastSignal = hoursSinceLastSignal(recent)
                    return { login: loginData(request), history: history, tradingAlerts: results[0], users: userData }
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

    eula_users.oneDayOldFreeUsers = eula_users.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneDayAgo).length
    eula_users.oneDayOldFreePlusUsers = eula_users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneDayAgo).length
    eula_users.oneDayOldTier1Users = eula_users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneDayAgo).length

    eula_users.oneMonthOldFreeUsers = eula_users.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneMonthAgo).length
    eula_users.oneMonthOldFreePlusUsers = eula_users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneMonthAgo).length
    eula_users.oneMonthOldTier1Users = eula_users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneMonthAgo).length

    eula_users.oneWeekOldFreeUsers = eula_users.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneWeekAgo).length
    eula_users.oneWeekOldFreePlusUsers = eula_users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneWeekAgo).length
    eula_users.oneWeekOldTier1Users = eula_users.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneWeekAgo).length

    eula_users.TotalMuted = eula_users.filter(user => user.settings.is_muted).length
    eula_users.TotalCryptoEnabled = eula_users.filter(user => user.settings.is_crowd_enabled).length

    eula_users.TotalShort = eula_users.filter(user => user.settings.horizon == 'short').length
    eula_users.TotalMedium = eula_users.filter(user => user.settings.horizon == 'medium').length
    eula_users.TotalLong = eula_users.filter(user => user.settings.horizon == 'long').length

    eula_users.TotalFree = eula_users.filter(user => user.currentPlan.plan == "FREE").length
    eula_users.TotalFreePlus = eula_users.filter(user => user.currentPlan.plan == "BETA").length
    eula_users.TotalTier1 = eula_users.filter(user => user.currentPlan.plan == "PAID").length

    return eula_users
}