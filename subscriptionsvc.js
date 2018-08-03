var telegramBot = require('./util/telegramBot').bot
var markdown = require('./util/telegramBot').nopreview_markdown_opts
var database = require('./database')
database.connect()
var UserModel = require('./models/User')
var moment = require('moment')


var run = () => {
    console.log('Running Subscription Service')
    checkSubscriptionExpDate().then(() => {
        process.exit()
    })
}

function checkSubscriptionExpDate() {
    var days5Ago = moment().add(-5, 'days').format('YYYY-MM-DD')
    return UserModel.find({ $and: [{ $where: "this.settings.ittTransactions.length > 0" }, { 'settings.subscriptions.paid': { $gte: days5Ago } }] })
        .then(users => {
            var notifications = []

            users.filter(u => {
                var daysLeft = Math.abs(moment(u.settings.subscriptions.paid).diff(moment(), 'days'))
                return (daysLeft <= 5 && daysLeft % 2 == 1) || daysLeft == 0
            }).map(u => {

                var inNDays = moment(u.settings.subscriptions.paid).diff(moment(), 'days') == 0 ? 'today' : moment(u.settings.subscriptions.paid).fromNow()

                var expiringSubscriptionMessage = ''
                if (inNDays.includes('ago'))
                    expiringSubscriptionMessage = '❌ *Your subscription has expired!*\n\nRenew now to regain access to your premium alerts.\n/subscribe or [check the pricing page](https://intelligenttrading.org/pricing/)'
                else
                    expiringSubscriptionMessage = `⚠️ *Your plan expires ${(inNDays == 'in a day' ? 'tomorrow' : inNDays)}.*\n\nRenew now to extend your subscription${inNDays == 'today' || inNDays == 'tomorrow' ? ', or you will lose access to all of your alerts' : ''}.\n/subscribe or [check the pricing page](https://intelligenttrading.org/pricing/)`

                notifications.push(telegramBot.sendMessage(u.telegram_chat_id, expiringSubscriptionMessage, markdown))
            })

            return Promise.all(notifications).catch(err => console.log(err))
        }).catch(err => console.log(err))
}

run()