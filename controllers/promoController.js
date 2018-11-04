const bot = require('../util/telegramBot').bot
const nopreview_markdown_opts = require('../util/telegramBot').nopreview_markdown_opts
var UserModel = require('../models/User')
var PromoModel = require('../models/Promo')
var moment = require('moment')

module.exports = promoController = {
    apply: async (telegram_chat_id, code) => {
        if (!telegram_chat_id || !code)
            return Promise.reject('Please provide all the required parameters.')

        // check if code belongs to an active campaing (how many voucher issued, how many left)
        var promo = await PromoModel.findOne({ active: true, code: code })
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })

        if (promo && user) {
            if (!user.settings.promos.map(p => p.code).includes(promo.code)) {
                user.settings.promos.push({ code: promo.code, active: true })
                var promoDurationInDays = promo.toDays()

                if (user.settings.subscriptions.frozen)
                    user.settings.subscriptions.frozenHours += promoDurationInDays
                else
                    user.settings.subscriptions.paid = moment.max(moment(), moment(user.settings.subscriptions.paid)).add(promoDurationInDays, 'days')

                user.save()
                promo.redeem(telegram_chat_id)
                promo.save()

                return { success: true, message: promo.label + ' applied!' }
            }
            else {
                return { success: false, reason: 'Promo already applied to this user' }
            }
        }
    },
    get: async (code) => {
        return await PromoModel.findOne({ code: code })
    }
}