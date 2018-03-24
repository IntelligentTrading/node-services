var speakeasy = require('speakeasy')
var UserModel = require('../models/User')

var tokenDuration = 300

module.exports = TwoFA = {
    generateSecretFor: (telegram_chat_id) => {
        var secret = speakeasy.generateSecret()
        return UserModel.update({ telegram_chat_id: telegram_chat_id }, {
            'settings.TwoFASecret': { secret32: secret.base32, otpAuthUrl: secret.otpauth_url }
        }).then(() => { return secret })
    },
    getToken: (telegram_chat_id) => {
        if (!telegram_chat_id) throw new Error('telegram_chat_id cannot be null')

        return UserModel.findOne({ telegram_chat_id: telegram_chat_id })
            .then(user => {
                if (!user) throw new Error('User not found')
                return speakeasy.totp({
                    secret: user.settings.TwoFASecret.secret32,
                    encoding: 'base32',
                    time: tokenDuration
                })
            })
    },
    verify: async (telegram_chat_id, token) => {
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        if (!user || !token) return false
        return speakeasy.totp.verify({
            secret: user.settings.TwoFASecret.secret32,
            encoding: 'base32',
            token: token,
            time: tokenDuration
        })
    }
}