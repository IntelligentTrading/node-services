var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    telegram_chat_id: Number,
    settings: {
        horizon: {
            type: String, default: 'medium'
        },
        risk: {
            type: String, default: 'medium'
        },
        is_crowd_enabled: {
            type: Boolean, default: true
        },
        is_muted: {
            type: Boolean, default: false
        },
        is_ITT_team: {
            type: Boolean, default: false
        },
        subscription_plan: { type: Number, default: 0 }, // 0 = free
        subscriptions: {
            free: { type: Date, default: new Date(2020, 12, 31) },
            beta: { type: Date, default: Date.now() },
            paid: { type: Date, default: Date.now() }
        },
        ittTransactions: { type: [String], default: [] },
        ittWalletReceiverAddress: String,
        counter_currencies: { type: [Number], default: [0, 2] }, //0,1,2,3 => [BTC,ETH,USD,XMR]
        transaction_currencies: { type: [String], default: ["BTC", "ETH", "BCH", "XMR", "ZEC", "DASH", "LTC"] }
    },
    eula: { type: Boolean, default: false },
    token: { type: String, default: '' },
    created: { type: Date, default: Date.now() }
});


var User = mongoose.model('User', userSchema);
module.exports = User