var UserModel = require('../models/User')
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const broadcast_markdown_opts = {
    parse_mode: "Markdown"
};

module.exports = {
    broadcast: (req, res) => {

        UserModel.find().then(users => {

            var maxSimultaneousBroadcastSize = 20
            var slices = Math.ceil(users.length / maxSimultaneousBroadcastSize)

            var replaceables = req.body.replace;

            if (req.body.buttons) {
                var keyboard = [];
                var kb_btns = [];
                req.body.buttons.forEach(btn => kb_btns.push(btn));
                broadcast_markdown_opts.reply_markup = {
                    inline_keyboard: [kb_btns]
                }
            }

            for (current_slice = 0; current_slice < slices; current_slice++) {
                users.slice(current_slice * maxSimultaneousBroadcastSize, maxSimultaneousBroadcastSize * (current_slice + 1) - 1)
                    .forEach(user => {
                        var final_message = "";

                        replaceables.forEach(replaceable => {
                            final_message = req.body.text.replace(replaceable.key, user[replaceable.value])
                        })

                        bot.sendMessage(user.telegram_chat_id, final_message, broadcast_markdown_opts)
                            .catch(reason => console.log(`${user.telegram_chat_id}:${reason}`));
                    })
            }
        })
            .then(result => res.send(200))
            .catch(reason => { console.log(reason); res.send(500) })
    }
}