var userController = require('../controllers/usersController')
var promoController = require('../controllers/promoController')
const bot = require('../util/telegramBot').bot
const broadcast_markdown_opts = require('../util/telegramBot').markdown
const broadcast_html_opts = require('../util/telegramBot').html
var dateUtil = require('../util/dates')

module.exports = {
    /**
     * filter must be any property of the UserModel inclusive. 
     * List of filters:
     * plan=free,beta,paid
     * no filter = deliver to everybody
     */
    broadcast: (message, deliverTo, useHTML = false) => {

        return userController.all()
            .then(async (users) => {
                var receivers = []
                if (deliverTo && deliverTo.plan.length > 0) {
                    var userPlans = deliverTo.plan.split(',').map(p => p.toLowerCase())

                    if (userPlans.indexOf('itt') > -1) {
                        receivers = receivers.concat(users.filter(user => user.settings.is_ITT_team))
                    }
                    if (userPlans.indexOf('free') > -1) {
                        var freeUsers = users.filter(user => dateUtil.getDaysLeftFrom(user.settings.subscriptions.paid) <= 0 && !(user.settings.staking && user.settings.staking.diecimila) && !user.settings.is_ITT_team)
                        receivers = receivers.concat(freeUsers)
                    }
                    if (userPlans.indexOf('pro') > -1) {
                        var proUsers = users.filter(user => dateUtil.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 || (user.settings.staking && user.settings.staking.diecimila))
                        receivers = receivers.concat(proUsers)
                    }
                    if (userPlans.indexOf('trial') > -1) {
                        var promoUsers = await userController.getPromoUsers()
                        receivers = receivers.concat(promoUsers.activePromoUsers)
                    }
                }

                var maxSimultaneousBroadcastSize = 20
                var slices = Math.ceil(receivers.length / maxSimultaneousBroadcastSize)

                for (current_slice = 0; current_slice < slices; current_slice++) {
                    receivers.slice(current_slice * maxSimultaneousBroadcastSize, maxSimultaneousBroadcastSize * (current_slice + 1) - 1)
                        .map(user => {
                            bot.sendMessage(user.telegram_chat_id, message, useHTML ? broadcast_html_opts : broadcast_markdown_opts)
                                .catch(reason => console.log(`${user.telegram_chat_id}:${reason}`));
                        })
                }
            })
            .then(() => { return {} })
    },
    ask: (question) => {

        var callbackData = `{"cmd":"settings","d":{"stopped":false},"n":"Biz"}`

        var options = { parse_mode: "Markdown", disable_web_page_preview: "true" }
        options.reply_markup = {
            inline_keyboard: [[{ text: "Continue", callback_data: callbackData }]]
        }

        return userController.all().then(users => {
            var freeBetaUsers = users.filter(user => !dateUtil.hasValidSubscription(user))
            var maxSimultaneousBroadcastSize = 20
            var slices = Math.ceil(freeBetaUsers.length / maxSimultaneousBroadcastSize)

            for (current_slice = 0; current_slice < slices; current_slice++) {
                freeBetaUsers.slice(current_slice * maxSimultaneousBroadcastSize, maxSimultaneousBroadcastSize * (current_slice + 1) - 1)
                    .map(user => {
                        bot.sendMessage(user.telegram_chat_id, question, options)
                            .catch(reason => console.log(`${user.telegram_chat_id}:${reason}`));
                    })
            }
        })
    }
}