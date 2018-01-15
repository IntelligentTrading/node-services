var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    secret = process.env.SUBSCRIPTION_SECRET;

function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, secret)
    var crypted = cipher.update(text, 'utf8', 'base64')
    crypted += cipher.final('base64');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(algorithm, secret)
    var dec = decipher.update(text, 'base64', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

function generateUniqueCode() {
    return (Math.round(Math.random() * 100000) * process.env.A_PRIME_NUMBER).toString(16)
}

var argo = {
    subscription: {
        generate: (plan) => {
            return {
                plan: plan,
                code: generateUniqueCode(),
                creation_date: Date.now()
            }
        },
        verify: (license) => {
            return argo.isValidSubscriptionToken(license.code) && !license.redeemed
        }
    },
    isITTMember: (token) => {
        var team_emojis = process.env.TEAM_EMOJIS.split(',');
        return team_emojis.indexOf(token) >= 0;
    },
    isValidSubscriptionToken: (token) => {
        return parseInt(token, 16) % parseInt(process.env.A_PRIME_NUMBER) == 0;
    }
}

exports.argo = argo;