var dateUtils = require('../../util/dates')

var buildUserData = (users) => {
    var users_data = users
    users_data.map(user => {
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

    users_data.oneDayOldUsers = users_data.filter(user => user.createdAt > oneDayAgo).length
    users_data.oneWeekOldUsers = users_data.filter(user => user.createdAt > oneWeekAgo).length
    users_data.oneMonthOldUsers = users_data.filter(user => user.createdAt > oneMonthAgo).length

    users_data.oneDayOldFreeUsers = users_data.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneDayAgo).length
    users_data.oneDayOldFreePlusUsers = users_data.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneDayAgo).length
    users_data.oneDayOldTier1Users = users_data.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneDayAgo).length

    users_data.oneMonthOldFreeUsers = users_data.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneMonthAgo).length
    users_data.oneMonthOldFreePlusUsers = users_data.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneMonthAgo).length
    users_data.oneMonthOldTier1Users = users_data.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneMonthAgo).length

    users_data.oneWeekOldFreeUsers = users_data.filter(user => !dateUtils.hasValidSubscription(user) && user.createdAt > oneWeekAgo).length
    users_data.oneWeekOldFreePlusUsers = users_data.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 && user.createdAt > oneWeekAgo).length
    users_data.oneWeekOldTier1Users = users_data.filter(user => dateUtils.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 && user.createdAt > oneWeekAgo).length

    users_data.TotalMuted = users_data.filter(user => user.settings.is_muted).length
    users_data.TotalCryptoEnabled = users_data.filter(user => user.settings.is_crowd_enabled).length
    users_data.ActiveToday = users_data.filter(user => user.updatedAt > oneDayAgo).length

    users_data.TotalShort = users_data.filter(user => user.settings.horizon == 'short').length
    users_data.TotalMedium = users_data.filter(user => user.settings.horizon == 'medium').length
    users_data.TotalLong = users_data.filter(user => user.settings.horizon == 'long').length

    users_data.TotalFree = users_data.filter(user => user.currentPlan.plan == "FREE").length
    users_data.TotalFreePlus = users_data.filter(user => user.currentPlan.plan == "BETA").length
    users_data.TotalTier1 = users_data.filter(user => user.currentPlan.plan == "PAID").length

    return users_data
}

module.exports = {
    buildUserData: buildUserData
}