var telegramBot = require('../../util/telegramBot').bot
var markdown = require('../../util/telegramBot').markdown
var UserModel = require('../../models/User')

var eula_endpoint = process.env.DOMAIN

module.exports.do = (user) => {
    setTimeout(() => {
        UserModel.findOne({ telegram_chat_id: user.telegram_chat_id }).then(user => {
            if (!user.eula) {
                var eulaMsg = `*ITT Team*\n\nWe noticed that your bot is not working. In order to use the bot you MUST accept the [End User Licensing Agreement](https://${eula_endpoint}/eula?u=${user.telegram_chat_id})`
                telegramBot.sendMessage(user.telegram_chat_id, eulaMsg, markdown).catch(err => console.log(err))
            }
        })
    }, 15 * 1000) //15 * 60 * 1000 = 15 minutes
}