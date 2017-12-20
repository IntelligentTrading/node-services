var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    chat_id: Number,
    settings: {
        horizon: String,
        is_subscribed: Boolean,
        risk: String,
        is_muted: Boolean,
        beta_token_valid: Boolean,
        is_ITT_team: Boolean,
        counter_currencies: { type: [Number], default: [0] }, //0,1,2,3 => [BTC,ETH,USD,XMR]
        transaction_currencies: [String]
    },
    eula: Boolean
});

var User = mongoose.model('User', userSchema);
User.prototype.updateSettings = function (settings) {

    if (settings) {

        var settingsToUpdate = Object.keys(settings);
        var _user = this;
        settingsToUpdate.forEach(settingToUpdate => {
            _user.settings[settingToUpdate] = settings[settingToUpdate];
        });
        _user.save();
    }
}

User.prototype.updateUserTransactionCurrencies = function (transaction_currencies) {

    var _user = this;
    transaction_currencies.forEach((currency) => {
        if (currency.follow == 'True' || currency.follow == 'true') {
            _user.settings.transaction_currencies.push(currency.symbol)
        }
        else {
            var index_of_victim = _user.settings.transaction_currencies.indexOf(currency.symbol);

            if (index_of_victim >= 0)
                _user.settings.transaction_currencies.splice(index_of_victim, 1);
        }
    })

    _user.save();
}

module.exports = User;