console.log('Subscription Service')

var telegramBot = require('./util/telegramBot').bot
var markdown = require('./util/telegramBot').nopreview_markdown_opts
var database = require('./database')
database.connect()

var userCtrl = require('./controllers/usersController')
var UserModel = require('./models/User')
var dateUtil = require('./util/dates')
var moment = require('moment')
var _ = require('lodash')


var run = () => {
    notifyExpiring().then(() => {
        process.exit()
    })
}

function notifyExpiring() {

    var now = moment().format('YYYY-MM-DD')
    return UserModel.find({ 'settings.subscriptions.paid': { $gte: now } })
        .then(users => {
            var notifications = []

            users.filter(u => {
                var daysLeft = moment(u.settings.subscriptions.paid).diff(moment(), 'days')
                return (daysLeft <= 5 && daysLeft % 2 == 1) || daysLeft == 0
            }).map(u => {

                var inNDays = moment(u.settings.subscriptions.paid).diff(moment(), 'days') == 0 ? 'today' : moment(u.settings.subscriptions.paid).fromNow()

                var expiringSubscriptionMessage = `⚠️ *Your plan expires ${(inNDays == 'in a day' ? 'tomorrow' : inNDays)}.*\n\nRenew now to extend your subscription${inNDays == 'today' || inNDays == 'tomorrow' ? ', or you will lose access to all of your alerts' : ''}.\n/subscribe or [check the pricing page](https://intelligenttrading.org/pricing/)`

                notifications.push(telegramBot.sendMessage(u.telegram_chat_id, expiringSubscriptionMessage, markdown))
            })

            return Promise.all(notifications).catch(err => console.log(err))
        }).catch(err => console.log(err))
}

function notifyExpired(){

}

run()