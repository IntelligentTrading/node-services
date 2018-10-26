var UserModel = require('../models/User')
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
        return UserModel.find()
            .then(users => {
                var receivers = []
                if (deliverTo && deliverTo.plan.length > 0) {
                    var userPlans = deliverTo.plan.split(',').map(p => p.toLowerCase())

                    if (userPlans.indexOf('itt') > -1) {
                        receivers = users.filter(user => user.settings.is_ITT_team)
                    } else {

                        if (userPlans.indexOf('free') > -1) {
                            receivers = users.filter(user => !dateUtil.hasValidSubscription(user))
                        }
                        if (userPlans.indexOf('beta') > -1) {
                            var betaUsrs = users.filter(user => dateUtil.hasValidSubscription(user) && dateUtil.getDaysLeftFrom(user.settings.subscriptions.paid) <= 0)
                            receivers = receivers.concat(betaUsrs)
                        }
                        if (userPlans.indexOf('paid') > -1) {
                            var paidUsrs = users.filter(user => dateUtil.getDaysLeftFrom(user.settings.subscriptions.paid) > 0)
                            receivers = receivers.concat(paidUsrs)
                        }
                        if(userPlans.indexOf('stakediecimila') > -1){
                            var diecimilaUsrs = users.filter(user => user.settings.staking && user.settings.staking.diecimila)
                            receivers = receivers.concat(diecimilaUsrs)
                        }
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