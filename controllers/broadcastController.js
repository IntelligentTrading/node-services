var UserModel = require('../models/User')
const bot = require('../util/telegramBot').bot
const broadcast_markdown_opts = require('../util/telegramBot').markdown

module.exports = {
    broadcast: (message) => {
        return UserModel.find()
            .then(users => {

                var maxSimultaneousBroadcastSize = 20
                var slices = Math.ceil(users.length / maxSimultaneousBroadcastSize)

                for (current_slice = 0; current_slice < slices; current_slice++) {
                    users.slice(current_slice * maxSimultaneousBroadcastSize, maxSimultaneousBroadcastSize * (current_slice + 1) - 1)
                        .map(user => {
                            bot.sendMessage(user.telegram_chat_id, message, broadcast_markdown_opts)
                                .catch(reason => console.log(`${telegram_chat_id}:${reason}`));
                        })
                }
            })
            .then(() => { return {} })
    }
}