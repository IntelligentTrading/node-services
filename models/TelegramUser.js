var telegramBot = require('../util/telegramBot').bot
var telegramOpts = require('../util/telegramBot').nopreview_markdown_opts

var horizons = ['long', 'medium', 'short']

class TelegramUser {
    constructor(dbuser) {
        if (!dbuser) throw new Error('You need to pass a db user to initialize the wrapper')
        this._dbuser = dbuser
    }

    itsMe(telegram_chat_id) {
        return parseInt(this._dbuser.telegram_chat_id) === parseInt(telegram_chat_id)
    }

    canReceive(signalWrapper) {
        //check if the horizon allows delivery
        var hasTheRightHorizon = horizons.indexOf(signalWrapper.horizon) <= horizons.indexOf(this._dbuser.settings.horizon) >= 0

        return this._dbuser.eula && hasTheRightHorizon
    }

    notify(message) {
        return telegramBot.sendMessage(this._dbuser.telegram_chat_id, message, telegramOpts)
    }

    chatId() {
        return this._dbuser.telegram_chat_id
    }
}

module.exports = TelegramUser