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
                if (user.eula) {
                    user.alreadyAccepted = true
                }
                else {
                    user.eula = true
                    user.alreadyAccepted = false
                }
                user.save()
                return user
            }).then((eulaUser) => {
                response.render('eula_done')
                var eulaDoneMsg = !eulaUser.alreadyAccepted
                    ? 'Thanks for accepting the EULA, you are now subscribed to our FREE plan. Check your /settings to learn more.'
                    : 'You already accepted the EULA. Check your /settings or /subscribe for details on our subscription plans.'

                bot.sendMessage(chat_id, eulaDoneMsg).then(() => {
                    historyCtrl.getSignalHistory({
                        trend: 1,
                        horizon: 0,
                        counter_currency: 2,
                        source: 0
                    }).then(historyEntriesJson => {
                        bot.sendMessage(chat_id, 'Here are some recent signals:')
                            .then(() => {
                                var historyEntries = JSON.parse(historyEntriesJson).results.filter(r => r.signal != 'SMA' &&
                                    ["BTC", "ETH", "LTC", "BCH", "XRP", "XMR"].indexOf(r.transaction_currency) >= 0).slice(0, 3)
                                var historySignalsPromises = historyEntries.map(entry => {
                                    var templatedSignal = historyCtrl.applyTemplate(entry)
                                    return bot.sendMessage(chat_id, templatedSignal, markdown_opts)
                                })
                                Promise.all(historySignalsPromises).then(() => {
                                    if (!eulaUser.alreadyAccepted) {
                                        bot.sendMessage(chat_id, '/subscribe to get premium signals and features!', markdown_opts)
                                    }
                                })
                            })
                    })
                }).catch(reason => {
                    console.log(reason)
                    bot.sendMessage(chat_id, 'Something went wrong while accepting the EULA, please retry or contact us!')
                })
            })
        }
    }
}
