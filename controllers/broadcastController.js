var UserModel = require('../models/User')
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const broadcast_markdown_opts = {
    parse_mode: "Markdown"
};

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