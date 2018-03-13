var speakeasy = require('speakeasy')
var UserModel = require('../models/User')

var tokenDuration = 300

module.exports = TwoFA = {
    generateSecretFor: async (chat_id) => {
        var secret = speakeasy.generateSecret()
        await UserModel.update({ telegram_chat_id: chat_id }, {
            'settings.TwoFASecret': { secret32: secret.base32, otpAuthUrl: secret.otpauth_url }
        })
        return secret
    },
    generateSecretApi: (req, res) => {
        TwoFA.generateSecretFor(req.params.telegram_chat_id)
            .then(secret => res.send(secret))
            .catch(err => res.status(500).send(err.message))
    },
    getQRData: (chat_id) => {
        UserModel.findOne({ telegram_chat_id: chat_id })
            .then(user => { return user.settings.TwoFASecret.otpAuthUrl })
    },
    getQRDataApi: async (req, res) => {
        TwoFA.getQRData(req.params.telegram_chat_id)
            .then(qrData => res.send(qrData))
            .catch(err => res.status(500).send(err.message))
    },
    getToken: (chat_id) => {
        if (!chat_id) throw new Error('telegram_chat_id cannot be null')

        return UserModel.findOne({ telegram_chat_id: chat_id })
            .then(user => {
                if (!user) throw new Error('User not found')
                return speakeasy.totp({
                    secret: user.settings.TwoFASecret.secret32,
                    encoding: 'base32',
                    time: tokenDuration
                })
            })
    },
    getTokenApi: (req, res) => {
        TwoFA.getToken(req.params.telegram_chat_id)
            .then(token => res.send(token))
            .catch(err => res.status(500).send(err.message))
    },
    verify: async (chat_id, token) => {
        var user = await UserModel.findOne({ telegram_chat_id: chat_id })
        if (!user || !token) return false
        return speakeasy.totp.verify({
            secret: user.settings.TwoFASecret.secret32,
            encoding: 'base32',
            token: token,
            time: tokenDuration
        })
    },
    verifyApi: (req, res) => {
        var telegram_chat_id = req.query.telegram_chat_id
        var token = req.query.token

        TwoFA.verify(telegram_chat_id, token)
            .then(verified => res.send(verified ? true : false))
    }
}