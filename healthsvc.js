console.log('Health Service')

var telegramBot = require('./util/telegramBot').bot
var markdown = require('./util/telegramBot').markdown
var database = require('./database')
database.connect()

var userCtrl = require('./controllers/usersController')
var UserModel = require('./models/User')
var dateUtil = require('./util/dates')
var moment = require('moment')
var _ = require('lodash')


const MAX_HOURS_WITHOUT_SIGNAL_SHORT = 24
const MAX_HOURS_WITHOUT_SIGNAL_MEDIUM = 24
const MAX_HOURS_WITHOUT_SIGNAL_LONG = 60

var run = () => {
    userCtrl.all().then(users => {
        Promise.all([lastSignalDeliveredCheck(users),
        checkWrongConfigurations(users),
        checkWeakConfigurations(users),
        eulaCheck(users)])
            .then(() => {
                console.log('Health check completed')
                process.exit()
            })
    })
}

function eulaCheck(users) {
    if (moment().date() % 3 == 0 && moment().hour() == 13) {
        console.log('Checking EULA status for bot users...')

        var notification_promises = []
        users.filter(user => !user.settings.eula).map(user => {
            var eulaMsg = `*ITT Team*\n\nWe noticed that your bot is not working. In order to use the bot you MUST accept the [End User Licensing Agreement](https://${process.env.DOMAIN}/eula?u=${user.telegram_chat_id})`
            notification_promises.push(telegramBot.sendMessage(user.telegram_chat_id, eulaMsg, markdown).catch(err => console.log(err)))
        })

        return Promise.all(notification_promises).then(() => {
            console.log('EULA reminders sent.')
        })
    }
    else
        console.log('EULA status checked every 3 days only.')
}

function lastSignalDeliveredCheck() {
    console.log('Checking signals delivered to users...')

    var not_enough_signals_message =
        `⚠️*Configuration Warning*

It looks like you're missing signals and cryptomarket updates due to your current subscription plan or configuration.
Check your /settings or /subscribe for a better experience!
Our [User Guide](http://intelligenttrading.org/guides/bot-user-guide/) can help to configure the bot properly.`

    var blind_short_users_promise = UserModel.find({ $and: [{ eula: true }, { 'settings.lastSignalReceived.on': { $lt: moment().add(-1 * MAX_HOURS_WITHOUT_SIGNAL_SHORT, 'hours').format('YYYY-MM-DD HH:MM') } }, { 'settings.horizon': 'short' }] })
    var blind_medium_users_promise = UserModel.find({ $and: [{ eula: true }, { 'settings.lastSignalReceived.on': { $lt: moment().add(-1 * MAX_HOURS_WITHOUT_SIGNAL_MEDIUM, 'hours').format('YYYY-MM-DD HH:MM') } }, { 'settings.horizon': 'medium' }] })
    var blind_long_users_promise = UserModel.find({ $and: [{ eula: true }, { 'settings.lastSignalReceived.on': { $lt: moment().add(-1 * MAX_HOURS_WITHOUT_SIGNAL_LONG, 'hours').format('YYYY-MM-DD HH:MM') } }, { 'settings.horizon': 'long' }] })

    return Promise.all([blind_short_users_promise, blind_medium_users_promise, blind_long_users_promise])
        .then(users => {
            var blind_users = _.concat(users[0], users[1], users[2])

            var messagePromises = blind_users.map(blind_user => {
                return telegramBot.sendMessage(blind_user.telegram_chat_id, not_enough_signals_message, markdown)
                    .catch(err => console.log(err))
            })

            return Promise.all(messagePromises).then(() => {
                return userCtrl.lastNotifiedSignal({ subscribersIds: blind_users.map(u => u.telegram_chat_id), signalId: -1 })
            }).catch(err => console.log(err))
        })
}

function checkWrongConfigurations(users) {
    console.log('Checking possible misconfigurations...')

    var no_counter_currencies_message = '⚠️ *Configuration Warning*\n\nYou have no valid trading pairs selected and no signals can be delivered!\n Check your signals /settings to be sure you have at least one valid trading pair!'

    return UserModel.find({ 'settings.counter_currencies.0': { $exists: false } }).then(no_counter_currencies_users => {

        if (no_counter_currencies_users) {
            var messagePromises = no_counter_currencies_users.filter(user => user.eula).map(nccu => {
                return telegramBot.sendMessage(nccu.telegram_chat_id, no_counter_currencies_message, markdown)
                    .catch(err => console.log(err))
            })

            return Promise.all(messagePromises).then(() => {
                return userCtrl.lastNotifiedSignal({ subscribersIds: no_counter_currencies_users.map(u => u.telegram_chat_id), signalId: -1 })
            }).catch(err => console.log(err))
        }
    })
}

function checkWeakConfigurations() {

    if (moment().hour() == 13) {

        console.log('Checking possible weak configurations...')

        var not_enough_currencies_message = '⚠️ *Configuration Warning*\n\nYou might not have enough valid trading pairs selected!\n Check your /settings and choose more coins to get more signals!'

        return UserModel.find({ 'settings.transaction_currencies.9': { $exists: false } }).then(few_currencies_users => {

            if (few_currencies_users) {
                var promises = few_currencies_users.filter(user => user.eula && dateUtil.hasValidSubscription(user)).map(fcu => {
                    return telegramBot.sendMessage(fcu.telegram_chat_id, not_enough_currencies_message, markdown)
                        .catch(err => console.log(err))
                })

                return Promise.all(promises).then(() => {
                    return userCtrl.lastNotifiedSignal({ subscribersIds: few_currencies_users.map(u => u.telegram_chat_id), signalId: -1 })
                }).catch((err) => console.log(err))
            }
        })
    }
}

run()