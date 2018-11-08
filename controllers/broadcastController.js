var TelegramUser = require('../models/TelegramUser')
var userController = require('../controllers/usersController')
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
            .then(users => {
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
    }
}