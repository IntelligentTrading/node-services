var dbapi = require('../api/db').database

module.exports = {
    broadcast: (req, res) => {

        dbapi.getUsers({}).then(users => {

            var slices = Math.ceil(users.length / 20);

            var broadcast_markdown_opts = {
                parse_mode: "Markdown"
            }

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
                users.slice(current_slice * 20, 20 * (current_slice + 1) - 1)
                    .forEach(user => {
                        var final_message = "";

                        replaceables.forEach(replaceable => {
                            final_message = req.body.text.replace(replaceable.key, user[replaceable.value])
                        })

                        bot.sendMessage(user.telegram_chat_id, final_message, broadcast_markdown_opts)
                            .then(console.log(`${user.telegram_chat_id} ok`))
                            .catch(reason => console.log(`${user.telegram_chat_id}:${reason}`));
                    })
            }
        })
            .then(result => res.send(200))
            .catch(reason => { console.log(reason); res.send(500) })
    }
}