var telegramBot = require('../util/telegramBot').bot
var telegramOpts = require('../util/telegramBot').nopreview_markdown_opts
var dateUtil = require('../util/dates')
require('./SignalWrapper')

var horizons = ['long', 'medium', 'short']

var planPredicates = {
    freePredicates: () => { return [] },
    betaPredicates: () => { return ['hasTheRightHorizon', 'isFollowingTheTicker', 'isFollowingTheCounter','isNotMuted'] },
    paidPredicates: () => { return ['hasTheRightHorizon', 'isFollowingTheTicker', 'isFollowingTheCounter', 'isFollowingTheExchange', 'isFollowingTheIndicator','isNotMuted'] },
    diecimilaPredicates: () => { return ['hasTheRightHorizon', 'isFollowingTheTicker', 'isFollowingTheCounter', 'isFollowingTheExchange', 'isFollowingTheIndicator','isNotMuted'] },
    centomilaPredicates: () => { return ['hasTheRightHorizon', 'isFollowingTheTicker', 'isFollowingTheCounter', 'isFollowingTheExchange', 'isFollowingTheIndicator','isNotMuted'] },
    ITTPredicates: () => { return ['hasTheRightHorizon', 'isFollowingTheTicker', 'isFollowingTheCounter', 'isFollowingTheExchange', 'isFollowingTheIndicator','isNotMuted'] }
}

class TelegramUser {
    constructor(dbuser) {
        if (!dbuser) throw new Error('You need to pass a db user to initialize the wrapper')
        this._dbuser = dbuser
        this._highestSubscriptionLevel = this.getMainSubscriptionLevel()
    }

    itsMe(telegram_chat_id) {
        return parseInt(this._dbuser.telegram_chat_id) === parseInt(telegram_chat_id)
    }

    canReceive(signalWrapper) {
        //check if the horizon allows delivery
        return this._dbuser.eula &&
            signalWrapper.IsDeliverableTo(this._highestSubscriptionLevel) && // check on signal side
            this.checkUserSettings(signalWrapper) // check on user's side
    }

    notify(message) {
        return telegramBot.sendMessage(this._dbuser.telegram_chat_id, message, telegramOpts).then(result => {
            return { success: true, telegram_chat_id: this._dbuser.telegram_chat_id }
        }).catch(err => {
            return {
                success: false, telegram_chat_id: this._dbuser.telegram_chat_id, reason: err.message.includes('400') ? 'Not Existing' : err.message.includes('403') ? 'Blocked' : err.message
            }
        })
    }

    chatId() {
        return this._dbuser.telegram_chat_id
    }

    getSubscriptionLevels() {
        var levels = {}
        levels.is_ITT_team = this._dbuser.settings.is_ITT_team
        levels.isAdvanced = this._dbuser.settings.staking.centomila
        levels.isPro = this._dbuser.settings.staking.diecimila
        levels.isStarter = dateUtil.getDaysLeftFrom(this._dbuser.settings.subscriptions.paid) > 0
        levels.isFreePlus = dateUtil.getDaysLeftFrom(this._dbuser.settings.subscriptions.beta) > 0
        return levels
    }

    getMainSubscriptionLevel() {
        var _subscriptionLevels = this.getSubscriptionLevels()

        var highestLevel = 'free'
        if (_subscriptionLevels.is_ITT_team) highestLevel = 'ITT'
        else if (_subscriptionLevels.isAdvanced) highestLevel = 'centomila'
        else if (_subscriptionLevels.isPro) highestLevel = 'diecimila'
        else if (_subscriptionLevels.isStarter) highestLevel = 'paid'
        else if (_subscriptionLevels.isFreePlus) highestLevel = 'beta'
        return highestLevel
    }

    checkUserSettings(signalWrapper) {

        var predicates = {
            hasTheRightHorizon: horizons.indexOf(signalWrapper.horizon) <= horizons.indexOf(this._dbuser.settings.horizon),
            isFollowingTheTicker: this._dbuser.settings.transaction_currencies.indexOf(signalWrapper.transaction_currency) >= 0,
            isFollowingTheCounter: this._dbuser.settings.counter_currencies.indexOf(parseInt(signalWrapper.counter_currency)) >= 0,
            isFollowingTheExchange: this._dbuser.settings.exchanges.find(exc => exc.label.toLowerCase() == signalWrapper.source.toLowerCase() && exc.enabled),
            isFollowingTheIndicator: this._dbuser.settings.indicators.find(ind => ind.enabled && ind.name == signalWrapper.label) != undefined,
            isNotMuted: !this._dbuser.settings.is_muted
        }

        var canDeliver = true
        planPredicates[this._highestSubscriptionLevel + 'Predicates']().forEach(p => {
            canDeliver = canDeliver && predicates[p]
        })
        return canDeliver
    }
}

module.exports = TelegramUser
