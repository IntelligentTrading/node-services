var _ = require('lodash')
var signalHelper = require('./signal-helper')
var usersController = require('../controllers/usersController')
var signalsController = require('../controllers/signalsController')
var subscriptionController = require('../controllers/subscriptionController')
var TelegramUser = require('../models/TelegramUser')
var SignalWrapper = require('../models/SignalWrapper')

//var socketDispatcher = require('../socket_dispatcher')

var subscriptionTemplates = []
var signalTemplates = []

init()


function notify(message_data) {

    if (message_data != undefined) {
        console.log(`${message_data.signal} signal`);

        var signalWrapper = new SignalWrapper(message_data, subscriptionTemplates, signalTemplates[message_data.signal])

        if (signalWrapper.HasErrors) return Promise.reject('Some signals might not be present in the database or in the templates base')

        return signalHelper.applyTemplate(signalWrapper)
            .then(telegram_signal_message => {
                if (!telegram_signal_message) throw new Error('Something went wrong, please retry!')

                // create a method to get already the notifiable users for a signal
                return usersController.all().then(candidates => {
                    var telegramCandidates = candidates.map(c => new TelegramUser(c))
                    var canReceiveCandidates = telegramCandidates.filter(tc => tc.canReceive(signalWrapper))
                    var allPromises = canReceiveCandidates.map(crc => crc.notify(telegram_signal_message))

                    console.log(`ℹ️ Sending to ${allPromises.length} chats`)

                    //socketDispatcher.dispatch(signalWrapper, canReceiveCandidates.map(crc => crc._dbuser.telegram_chat_id))

                    return Promise.all(allPromises)
                        .then((results) => {
                            var logObject = {
                                signalId: signalWrapper.id,
                                subscribersIds: results.map(r => r.telegram_chat_id)
                            }
                            var rejectingUsers = results.filter(r => !r.success)
                            var rejections = rejectingUsers.map(ru => ru.telegram_chat_id)
                            var reasons = rejectingUsers.map(ru => { return `${ru.telegram_chat_id} :: ${ru.reason}` })

                            return usersController.lastNotifiedSignal(logObject).then(() => {
                                return { signal_id: signalWrapper.id, rejections: rejections, reasons: reasons, sent_at: new Date(signalWrapper.sent) }
                            })
                        }).catch((err) => console.log(err))
                })
            })
    }
}

module.exports = { notify: notify }

function init() {

    subscriptionController.getSubscriptionTemplates().then(templates => {
        return templates.map(template => {
            subscriptionTemplates[template.label] = template
        })
    }).then(() => console.log('Subscription templates initialized'))

    signalsController.getSignals().then(templates => {
        return templates.map(template => {
            signalTemplates[template.label] = template
        })
    }).then(() => console.log('Signal templates initialized'))
}