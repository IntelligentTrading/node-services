var dateUtils = require('../../util/dates')
var _ = require('lodash')
var moment = require('moment')

var buildUserData = (users, lastRejectedSignal) => {
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
        user.hasBlockedOrLeft = lastRejectedSignal.rejections.includes(user.telegram_chat_id)
        user.LastActive = user.lastActiveInteractionAt ? 'Active '+moment(user.lastActiveInteractionAt).fromNow() : ''
    })

    var oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    var oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    var oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    moment().from()

    users_data.oneDayOldUsers = users_data.filter(user => moment(user.createdAt).isBetween(oneDayAgo, Date.now())).length
    users_data.oneDayOldUsersEula = users_data.filter(user => user.eula && moment(user.createdAt).isBetween(oneDayAgo, Date.now())).length
    users_data.oneWeekOldUsers = users_data.filter(user => moment(user.createdAt).isBetween(oneWeekAgo, Date.now())).length
    users_data.oneWeekOldUsersEula = users_data.filter(user => user.eula && moment(user.createdAt).isBetween(oneWeekAgo, Date.now())).length
    users_data.oneMonthOldUsers = users_data.filter(user => moment(user.createdAt).isBetween(oneMonthAgo, Date.now())).length
    users_data.oneMonthOldUsersEula = users_data.filter(user => user.eula && moment(user.createdAt).isBetween(oneMonthAgo, Date.now())).length

    var freeUsers = users_data.filter(user => user.currentPlan.plan == "FREE")
    var freePlusUsers = users_data.filter(user => user.currentPlan.plan == "BETA")
    var tier1Users = users_data.filter(user => user.currentPlan.plan == "PAID")

    users_data.oneDayOldFreeUsers = freeUsers.filter(user => moment(user.createdAt).isBetween(oneDayAgo, Date.now())).length
    users_data.oneDayOldFreePlusUsers = freePlusUsers.filter(user => moment(user.createdAt).isBetween(oneDayAgo, Date.now())).length
    users_data.oneDayOldTier1Users = users_data.filter(user => user.settings.subscriptionRenewed.on != null && moment(user.settings.subscriptionRenewed.on).isBetween(oneDayAgo, Date.now())).length

    users_data.oneWeekOldFreeUsers = freeUsers.filter(user => moment(user.createdAt).isBetween(oneWeekAgo, Date.now())).length
    users_data.oneWeekOldFreeUsersEula = freeUsers.filter(user => user.eula && moment(user.createdAt).isBetween(oneWeekAgo, Date.now())).length
    users_data.oneWeekOldFreePlusUsers = freePlusUsers.filter(user => moment(user.createdAt).isBetween(oneWeekAgo, Date.now())).length
    users_data.oneWeekOldTier1Users = users_data.filter(user => user.settings.subscriptionRenewed.on != null && moment(user.settings.subscriptionRenewed.on).isBetween(oneWeekAgo, Date.now())).length

    users_data.oneMonthOldFreeUsers = freeUsers.filter(user => moment(user.createdAt).isBetween(oneMonthAgo, Date.now())).length
    users_data.oneMonthOldFreeUsersEula = freeUsers.filter(user => user.eula && moment(user.createdAt).isBetween(oneMonthAgo, Date.now())).length
    users_data.oneMonthOldFreePlusUsers = freePlusUsers.filter(user => moment(user.createdAt).isBetween(oneMonthAgo, Date.now())).length
    users_data.oneMonthOldTier1Users = users_data.filter(user => user.settings.subscriptionRenewed.on != null && moment(user.settings.subscriptionRenewed.on).isBetween(oneMonthAgo, Date.now())).length

    users_data.TotalMuted = users_data.filter(user => user.settings.is_muted).length
    users_data.TotalFreeMuted = freeUsers.filter(user => user.settings.is_muted).length
    users_data.TotalFreePlusMuted = freePlusUsers.filter(user => user.settings.is_muted).length
    users_data.TotalTier1Muted = tier1Users.filter(user => user.settings.is_muted).length

    users_data.TotalCryptoEnabled = users_data.filter(user => user.settings.is_crowd_enabled).length
    users_data.ActiveToday = users_data.filter(user => user.lastActiveInteractionAt > oneDayAgo).length

    users_data.TotalShort = users_data.filter(user => user.settings.horizon == 'short').length
    users_data.TotalMedium = users_data.filter(user => user.settings.horizon == 'medium').length
    users_data.TotalLong = users_data.filter(user => user.settings.horizon == 'long').length

    users_data.TotalFree = freeUsers.length
    users_data.TotalEula = users.filter(u => u.eula).length
    users_data.TotalFreePlus = freePlusUsers.length
    users_data.TotalTier1 = tier1Users.length

    var grouped_users_data = _.groupBy(users_data, (user) => {
        var date = moment(user.createdAt).format().split('T')[0]
        return date
    })

    var grouped_sorted_users_data_array = _.sortBy(_.map(grouped_users_data, function (group, day) {
        return {
            day: day,
            total: group.length
        }
    }), 'day')

    users_data.UsersTimeline = grouped_sorted_users_data_array

    users_data.RunningTotalDayByDay = []
    var temp_total = 0
    grouped_sorted_users_data_array.forEach(group => {
        temp_total += group.total
        users_data.RunningTotalDayByDay.push({
            day: group.day,
            total: temp_total
        })
    })


    return users_data
}

module.exports = {
    buildUserData: buildUserData
}