var argo = require('../util/argo')
var License = require('../models/License')
var Plan = require('../models/Plan')
var User = require('../models/User')

module.exports = {
    generateLicense: (subscriptionPlan) => {
        if (!subscriptionPlan)
            return Promise.reject(new Error('Subscription plan cannot be undefined.'))

        var license = argo.subscription.generate(subscriptionPlan)

        if (!license)
            return Promise.reject(new Error('Something went wrong with the license generation. Please retry.'))

        return License.create(license).then(() => {
            return license
        })
    },
    subscribe: (licenseCode, telegram_chat_id) => {

        if (!licenseCode || !telegram_chat_id)
            return Promise.reject(new Error('License code or chat id parameters required'))

        return User.findOne({ telegram_chat_id: telegram_chat_id, eula: true })
            .then(user => {
                if (!user) return { success: false, message: 'EULA' }
                else {

                    var isMathematicallyCorrect = argo.subscription.checkMathematicalCorrectness(licenseCode)
                    var isITT = argo.isITTMember(licenseCode)

                    if (!isMathematicallyCorrect && !isITT)
                        return { success: false, message: 'Token is invalid!' }

                    return License.findOne({ code: licenseCode })
                        .then(license => {
                            if (license && license.redeemed)
                                return { success: false, message: 'Token already redeemed!' }

                            if (isITT) { license = { code: licenseCode } }
                            return setUserLicense(telegram_chat_id, license, isITT)
                                .then(result => {
                                    return { success: true, message: 'Token redeemed correctly!', user: result }
                                }).catch(reason => {
                                    return { success: false, message: reason.message }
                                })
                        })
                }
            })
    }
}

var setUserLicense = (telegram_chat_id, license, isItt) => {

    var promises = [];

    var subscriberPromise = User.findOne({ telegram_chat_id: telegram_chat_id, eula: true })
    promises.push(subscriberPromise)

    if (!isItt) {
        var planPromise = Plan.findOne({ 'plan': license.plan })
        promises.push(planPromise)
    }

    return Promise.all(promises).then(results => {
        var subscriber = results[0]
        var subscriptionPlan = results[1] ? results[1].accessLevel : 0
        if (!subscriber)
            throw new Error('EULA')

        subscriber.settings.is_ITT_team = isItt
        subscriber.token = license.code
        subscriber.settings.subscription_plan = isItt ? 100 : subscriptionPlan
        subscriber.save()

        License.findOneAndUpdate({ code: license.code }, { redeemed: true }, { new: true })
            .catch(err => console.log(err))

        return subscriber
    })
}