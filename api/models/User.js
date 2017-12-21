var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    chat_id: Number,
    settings: {
        horizon: {
            type: String, default: 'medium'
        },
        is_subscribed: {
            type: Boolean, default: false
        },
        risk: {
            type: String, default: 'medium'
        },
        is_muted: {
            type: Boolean, default: false
        },
        beta_token_valid: {
            type: Boolean, default: false
        },
        is_ITT_team: {
            type: Boolean, default: false
        },
        counter_currencies: { type: [Number], default: [0] }, //0,1,2,3 => [BTC,ETH,USD,XMR]
        transaction_currencies: [String]
    },
    eula: Boolean,
    created: { type: Date, default: Date.now() }
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

User.prototype.verify = (token) => {
    //some method to verify the token
    return true;
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

User.prototype.updateUserCounterCurrencies = function (counter_currencies) {

    var _user = this;
    counter_currencies.forEach((currency) => {
        if (currency.follow == 'True' || currency.follow == 'true') {
            _user.settings.counter_currencies.push(currency.index)
        }
        else {
            var index_of_victim = _user.settings.counter_currencies.indexOf(currency.index);

            if (index_of_victim >= 0)
                _user.settings.counter_currencies.splice(index_of_victim, 1);
        }
    })

    _user.save();
}

module.exports = User;