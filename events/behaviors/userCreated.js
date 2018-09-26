var telegramBot = require('../../util/telegramBot').bot
var markdown = require('../../util/telegramBot').markdown
var eula_endpoint = process.env.DOMAIN

module.exports.do = (user) => {
    setTimeout(() => {
        var userController = require('../../controllers/usersController')
        userController.getUser(user.telegram_chat_id).then((usr) => {
            if (!usr.eula) {
                var eulaMsg = `*ITT Team*\n\nWe noticed that your bot is not working. In order to use the bot you MUST accept the [End User Licensing Agreement](https://${eula_endpoint}/eula?u=${usr.telegram_chat_id})`
                telegramBot.sendMessage(usr.telegram_chat_id, eulaMsg, markdown).catch(err => console.log(err))
            }
        })
    }, 15 * 60 * 1000)// = 15 minutes
}
