var marketApi = require('../api/market')
var UserModel = require('../models/User')
var bot = require('../util/telegramBot').bot
var markdown_opts = require('../util/telegramBot').markdown
var historyCtrl = require('./historyController')

module.exports = {
    render: (request, response) => {
        var chat_id = request.query.u;
        if (!chat_id) {
            return response.sendStatus(500)
        }
        var eula_url = `/eula_confirm?u=${chat_id}`;
        response.render('eula', { eula_url: eula_url }, );
    },
    confirm: (request, response) => {
        var chat_id = request.query.u;
        if (!chat_id) {
            return response.sendStatus(500)
        }
        else {
            UserModel.findOne({ telegram_chat_id: chat_id }).then(user => {
                user.eula = true
                user.save()
                return user
            }).then((newUser) => {
                response.render('eula_done')
                var eulaDoneMsg = newUser
                    ? 'Thanks for accepting EULA, you can now check your /settings and subscribe to our plans or keep using the bot with the free plan.'
                    : 'You already accepted the EULA, you can now check your /settings and upgrade or keep using the bot with the current plan.'

                bot.sendMessage(chat_id, eulaDoneMsg)
            }).then(() => {
                historyCtrl.getSignalHistory({
                    trend: 1,
                    horizon: 1,
                    counter_currency: 2,
                    source: 0
                }).then(historyEntriesJson => {
                    bot.sendMessage(chat_id, 'In the meantime, this is a short list of the latest signals sent:')

                    var historyEntries = JSON.parse(historyEntriesJson).results.filter(r => r.signal != 'SMA').slice(0, 3)
                    historyEntries.forEach(entry => {
                        var templatedSignal = historyCtrl.applyTemplate(entry)
                        bot.sendMessage(chat_id, templatedSignal, markdown_opts)
                    })
                })
            }).catch(reason => {
                console.log(reason)
                bot.sendMessage(chat_id, 'Something went wrong while accepting EULA, please retry or contact us!')
            })
        }
    }
}