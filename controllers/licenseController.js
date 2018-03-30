var argo = require('../util/argo')
var License = require('../models/License')
var User = require('../models/User')

module.exports = {
    generateLicense: (subscriptionPlan) => {
        if (!subscriptionPlan)
            return Promise.reject(new Error('Subscription plan cannot be undefined.'))

        var license = argo.subscription.generate(subscriptionPlan)

        if (!license)
            return Promise.reject(new Error('Something went wrong with the license generation. Please retry.'))

        return License.create(license).then(() => {
            return { statusCode: 201, object: license }
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
    return User.findOne({ telegram_chat_id: telegram_chat_id, eula: true }).then(subscriber => {
        if (!subscriber) throw new Error('EULA')

        subscriber.settings.is_ITT_team = isItt
        subscriber.token = license.code
        subscriber.settings.subscriptions[license.plan] = new Date(2020, 12, 31)
        subscriber.save()
        return subscriber
    }).then(subscriber => {
        return License.findOneAndUpdate({ code: license.code }, { redeemed: true }, { new: true })
            .then(() => { return subscriber })
    })
}