var Hashids = require('hashids');
var hashids = new Hashids(process.env.A_PRIME_NUMBER);

module.exports = {
    referralGenerator: (telegram_chat_id) => {
        var codearray = parseInt(telegram_chat_id).toString().split('')
        return 'ITF' + hashids.encode(codearray)
    },
    check: (referred_telegram_chat_id, referee_code) => {
        if (!referred_telegram_chat_id || !referee_code) return { valid: false, reason: 'Empty user id or Code' }

        //avoid self referrals
        var decoded_telegram_id = hashids.decode(referee_code.substring(3)).join('')
        if (!decoded_telegram_id) return { valid: false, reason: 'Code is not valid' }

        if (parseInt(decoded_telegram_id) !== referred_telegram_chat_id)
            return { valid: true, referee_telegram_id: decoded_telegram_id }
        else
            return { valid: false, reason: 'This is your referral code! Share it with your friends!' }
    }
}