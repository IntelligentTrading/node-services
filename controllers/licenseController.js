var dbapi = require('../api/db').database
var argo = require('../util/argo')
var License = require('../api/models/License')

var self = this;

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

                dbapi.setUserLicense(telegram_chat_id, license, isITT).then(result => {
                    return res.status(200).send({ success: true, message: 'Token redeemed correctly!', user: result })
                }).catch(reason => {
                    return res.status(500).send(reason.message)
                })
            }
        })
    }
}
