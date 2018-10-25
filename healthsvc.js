console.log('Health Service')

var telegramBot = require('./util/telegramBot').bot
var markdown = require('./util/telegramBot').markdown
var userCtrl = require('./controllers/usersController')
var dateUtil = require('./util/dates')
var moment = require('moment')
var _ = require('lodash')

var database = require('./database')
database.connect()


const MAX_HOURS_WITHOUT_SIGNAL_SHORT = 24
const MAX_HOURS_WITHOUT_SIGNAL_MEDIUM = 24
const MAX_HOURS_WITHOUT_SIGNAL_LONG = 60

var run = () => {
    return userCtrl.all().then(async users => {
        var lsdUsers = await lastSignalDeliveredCheck(users.filter(u => u.eula))
        var cwcUsers = await checkWrongConfigurations(users.filter(u => u.eula))
        var cwecUsers = await checkWeakConfigurations(users.filter(u => u.eula))
        await eulaCheck(users.filter(u => !u.eula))

        var lastNotifiedUsers = _.union(lsdUsers, cwcUsers, cwecUsers)

        return userCtrl.lastNotifiedSignal({ subscribersIds: lastNotifiedUsers.map(u => { return u.telegram_chat_id }), signalId: -1 })
            .then(() => {
                console.log('Health check completed')
                process.exit()
            })
    })
}

function eulaCheck(users) {
    if (moment().date() % 3 == 0 && moment().hour() == 13) {
        console.log('Checking EULA status for bot users...')

        var notification_promises = users.map(user => {
            var eulaMsg = `*ITT Team*\n\nWe noticed that your bot is not working. In order to use the bot you MUST accept the [End User Licensing Agreement](https://${process.env.DOMAIN}/eula?u=${user.telegram_chat_id})`
            return telegramBot.sendMessage(user.telegram_chat_id, eulaMsg, markdown).catch(err => console.log(`EULA reminder not sent to ${user.telegram_chat_id}`))
        })

        return Promise.all(notification_promises)
    }
    else {
        console.log('EULA status checked every 3 days only.')
        return Promise.resolve()
    }
}

function lastSignalDeliveredCheck(users) {
    console.log('Checking signals delivered to users...')

    var not_enough_signals_message =
        `⚠️*Configuration Warning*

It looks like you're missing signals and cryptomarket updates due to your current subscription plan or configuration.
Check your /settings or /subscribe for a better experience!
Our [User Guide](http://intelligenttrading.org/guides/bot-user-guide/) can help to configure the bot properly.`

    var blindUsers = users.filter(u => u.settings.lastSignalReceived && (
        (moment().diff(u.settings.lastSignalReceived.on, 'hours') > MAX_HOURS_WITHOUT_SIGNAL_SHORT && u.settings.horizon == 'short') ||
        (moment().diff(u.settings.lastSignalReceived.on, 'hours') > MAX_HOURS_WITHOUT_SIGNAL_MEDIUM && u.settings.horizon == 'medium') ||
        (moment().diff(u.settings.lastSignalReceived.on, 'hours') > MAX_HOURS_WITHOUT_SIGNAL_LONG && u.settings.horizon == 'long')))

    var lastSignalReminderPromises = blindUsers.map(blind_user => {
        return telegramBot.sendMessage(blind_user.telegram_chat_id, not_enough_signals_message, markdown)
            .catch(err => console.log(`Last signal delivered check not sent to ${blind_user.telegram_chat_id}`))
    })

    return Promise.all(lastSignalReminderPromises).then(() => { return blindUsers })
}

function checkWrongConfigurations(users) {
    console.log('Checking possible misconfigurations...')

    var no_counter_currencies_message = '⚠️ *Configuration Warning*\n\nYou have no valid trading pairs selected and no signals can be delivered!\n Check your signals /settings to be sure you have at least one valid trading pair!'

    var no_counter_currencies_users = users.filter(u => !u.settings.counter_currencies || u.settings.counter_currencies.length == 0)
    var noCounterCurrenciesPromises = no_counter_currencies_users.map(no_counter_currencies_user => {
        return telegramBot.sendMessage(no_counter_currencies_user.telegram_chat_id, no_counter_currencies_message, markdown)
            .catch(err => console.log(`Misconfiguration reminder not sent to ${no_counter_currencies_user.telegram_chat_id}`))
    })

    return Promise.all(noCounterCurrenciesPromises).then(() => { return no_counter_currencies_users })
}

function checkWeakConfigurations(users) {

    if (true || moment().hour() == 13) {

        console.log('Checking possible weak configurations...')

        var not_enough_currencies_message = '⚠️ *Configuration Warning*\n\nYou might not have enough valid trading pairs selected!\n Check your /settings and choose more coins to get more signals!'

        var few_currencies_users = users.filter(u => dateUtil.hasValidSubscription(u) && (!u.settings.transaction_currencies || u.settings.transaction_currencies.length < 9))

        var promises = few_currencies_users.map(fcu => {
            return telegramBot.sendMessage(fcu.telegram_chat_id, not_enough_currencies_message, markdown)
                .catch(err => console.log(`Weak configuration reminder not sent to ${fcu.telegram_chat_id}`))
        })

        return Promise.all(promises).then(() => { return few_currencies_users })
    }
}

run()