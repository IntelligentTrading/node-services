var argo = require('../util/argo')
var License = require('../models/License')
var Plan = require('../models/Plan')
var User = require('../models/User')

module.exports = {
    generateLicense: (req, res) => {
        var subscriptionPlan = req.params.subscriptionPlan;

        if (!subscriptionPlan)
            return res.status(500).send('Subscription plan cannot be undefined')

        var license = argo.subscription.generate(subscriptionPlan)

        License.create(license).then(result => {
            res.status(201).send(license)
        })
    },
    subscribe: (req, res) => {
        //{licenseCode: token, telegram_chat_id: chat_id }
        var licenseCode = req.body.licenseCode
        var telegram_chat_id = req.body.telegram_chat_id

        if (!licenseCode || !telegram_chat_id)
            return res.status(400).send('License code or chat id parameters required')

        var isMathematicallyCorrect = argo.subscription.checkMathematicalCorrectness(licenseCode)
        var isITT = argo.isITTMember(licenseCode)

        if (!isMathematicallyCorrect && !isITT)
            return res.status(500).send('Token is invalid!')

        License.findOne({ code: licenseCode }).then(license => {

            if (license && license.redeemed)
                res.status(200).send({ success: false, message: 'Token already redeemed!' })
            else {

                if (isITT) {
                    license = {
                        code: licenseCode
                    }
                }
                setUserLicense(telegram_chat_id, license, isITT).then(result => {
                    return res.status(200).send({ success: true, message: 'Token redeemed correctly!', user: result })
                }).catch(reason => {
                    return res.status(500).send(reason.message)
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

        var licensePromise = License.update({ code: license.code }, { redeemed: true })
        promises.push(licensePromise)
    }

    return Promise.all(promises).then(results => {
        var subscriber = results[0]
        var subscriptionPlan = results[1] ? results[1].accessLevel : 0
        if (!subscriber)
            throw new Error('Your chat id is invalid or you did not accept the EULA!')

        subscriber.settings.is_ITT_Team = isItt
        subscriber.token = license.code
        subscriber.settings.subscription_plan = isItt ? 100 : subscriptionPlan
        subscriber.save()
        return subscriber
    })
}