var dateUtil = require('../util/dates')
var _ = require('lodash')
var signalHelper = require('./signal-helper')
var usersController = require('../controllers/usersController')
var signalsController = require('../controllers/signalsController')
var subscriptionController = require('../controllers/subscriptionController')
var TelegramUser = require('../models/TelegramUser')
var SignalWrapper = require('../models/SignalWrapper')

var subscriptionTemplates = []
var signalTemplates = []

init()


function notify(message_data) {

    if (message_data != undefined) {
        console.log(`${message_data.signal} signal`);

        var signalWrapper = new SignalWrapper(message_data, subscriptionTemplates, signalTemplates[message_data.signal])

        return signalHelper.applyTemplate(signalWrapper)
            .then(telegram_signal_message => {
                if (!telegram_signal_message) throw new Error('Something went wrong, please retry!')

                // create a method to get already the notifiable users for a signal
                return usersController.all().then(candidates => {
                    var telegramCandidates = candidates.map(c => new TelegramUser(c))
                    var canReceiveCandidates = telegramCandidates.filter(tc => tc.canReceive(signalWrapper))
                    var allPromises = canReceiveCandidates.map(crc => crc.notify(telegram_signal_message))
                    return Promise.all(allPromises)
                })
            })
    }
}

function notifyUsers(users, signal, message_data, telegram_signal_message) {

    //var horizon = message_data.horizon;
    var hrzns = horizons.slice(horizons.indexOf(message_data.horizon))
    users = users.filter(usr => hrzns.indexOf(usr.settings.horizon) >= 0)
    users = users.filter(user => (user.is_ITT_team || user.eula))

    var signalForNonno = isForNonno(signal, message_data)
    var signalForFree = isForFree(signal, message_data)
    var signalForStarter = isForStarter(signal, message_data)
    var signalForPro = isForPro(signal, message_data)
    var signalForAdvanced = isForAdvanced(signal, message_data)

    var matchingStarterUsers = users.filter(user => (user.settings.is_ITT_team || dateUtil.getDaysLeftFrom(user.settings.subscriptions.paid) > 0 || (user.settings.staking && user.settings.staking.diecimila)) &&
        user.settings.transaction_currencies.indexOf(message_data.transaction_currency) >= 0 &&
        user.settings.counter_currencies.indexOf(parseInt(message_data.counter_currency)) >= 0 &&
        !user.settings.is_muted
    )

    matchingStarterUsers = matchingStarterUsers.filter(user => {
        var matchingIndicator = user.settings.indicators.find(ind => ind.name == signal.label)
        return matchingIndicator && matchingIndicator.enabled
    })

    matchingStarterUsers = matchingStarterUsers.filter(user => {
        var matchingExchange = user.settings.exchanges.find(exc => exc.label.toLowerCase() == signal.source.toLowerCase())
        return matchingExchange && matchingExchange.enabled
    })

    var matchingBetaUsers = users.filter(user =>
        dateUtil.getDaysLeftFrom(user.settings.subscriptions.beta) > 0 &&
        dateUtil.getDaysLeftFrom(user.settings.subscriptions.paid) <= 0 &&
        !user.settings.is_ITT_team &&
        user.settings.transaction_currencies.indexOf(message_data.transaction_currency) >= 0 &&
        user.settings.counter_currencies.indexOf(parseInt(message_data.counter_currency)) >= 0 &&
        !user.settings.is_muted
    )

    var freeOnlyUsers = users.filter(user => (
        !dateUtil.hasValidSubscription(user)
    ))

    var subscribers = []

    if (signalForFree) {
        subscribers = freeOnlyUsers
        subscribers = subscribers.concat(matchingBetaUsers)
    }
    else if (signalForNonno) {
        subscribers = subscribers.concat(matchingBetaUsers)
    }

    if (signalForStarter)
        subscribers = _.unionBy(subscribers, matchingStarterUsers, 'telegram_chat_id')

    if (signalForPro)
        subscribers = _.unionBy(subscribers, matchingStarterUsers.filter(u => u.settings.staking && u.settings.staking.diecimila), 'telegram_chat_id')

    if (signalForAdvanced)
        subscribers = _.unionBy(subscribers, matchingStarterUsers.filter(u => u.settings.staking && u.settings.staking.centomila), 'telegram_chat_id')

    var rejections = []
    var reasons = []
    var notificationPromises = []
    var subscribersIds = []

    subscribers.map(subscriber => {
        var notificationPromise = bot.sendMessage(subscriber.telegram_chat_id, telegram_signal_message, opts)
            .then(() => {
                subscribersIds.push(subscriber.telegram_chat_id)
            })
            .catch(err => {
                rejections.push(subscriber.telegram_chat_id)
                reasons.push(`${subscriber.telegram_chat_id} :: ${err.message.includes('400') ? 'Not Existing' : err.message.includes('403') ? 'Blocked' : err.message}`)
                console.log(`${err.message} :: chat ${subscriber.telegram_chat_id}`)
            })

        notificationPromises.push(notificationPromise)
    })

    console.log(`ℹ️ Sending to ${subscribers.length} chats`)

    return Promise.all(notificationPromises)
        .then(() => {
            var logObject = {
                signalId: message_data.id,
                subscribersIds: subscribersIds
            }
            return usersController.lastNotifiedSignal(logObject).then(() => {
                return { signal_id: message_data.id, rejections: rejections, reasons: reasons, sent_at: new Date(message_data.sent) }
            })
        })
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