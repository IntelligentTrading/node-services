var UserModel = require('../models/User')
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const broadcast_markdown_opts = {
    parse_mode: "Markdown"
};

module.exports = {
    broadcast: (req, res) => {

        var replaceables = req.body.replace;
        var buttons = req.body.buttons;
        var message = req.body.text;


        UserModel.find().then(users => {

            var maxSimultaneousBroadcastSize = 20
            var slices = Math.ceil(users.length / maxSimultaneousBroadcastSize)

            if (buttons) {
                var keyboard = [];
                var kb_btns = [];
                buttons.forEach(btn => kb_btns.push(btn));
                broadcast_markdown_opts.reply_markup = {
                    inline_keyboard: [kb_btns]
                }
            }

            for (current_slice = 0; current_slice < slices; current_slice++) {
                users.slice(current_slice * maxSimultaneousBroadcastSize, maxSimultaneousBroadcastSize * (current_slice + 1) - 1)
                    .forEach(user => {
                        var final_message = "";

                        replaceables.forEach(replaceable => {
                            final_message = message.replace(replaceable.key, user[replaceable.value])
                        })

                        sendMessage(user.telegram_chat_id, final_message, broadcast_markdown_opts)
                    })
            }
        }).then(result => res.send(200))
            .catch(reason => { console.log(reason); res.send(500) })
    }
}

var sendMessage = (telegram_chat_id, message, opts) => {
    bot.sendMessage(telegram_chat_id, message, opts)
        .catch(reason => console.log(`${telegram_chat_id}:${reason}`));
}