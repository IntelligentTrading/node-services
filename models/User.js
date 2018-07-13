var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    telegram_chat_id: Number,
    settings: {
        horizon: {
            type: String, default: 'short'
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
        indicators: [{
            label: { type: String }, name: { type: String }, available: { type: Boolean }, enabled: { type: Boolean },
        }],
        ittTransactions: [{ tx: { type: String }, total: { type: Number } }],
        subscriptionRenewed: { plan: String, on: Date },
        lastSignalReceived: { signalId: Number, on: Date },
        ittWalletReceiverAddress: { type: String, default: 'No address generated' },
        counter_currencies: { type: [Number], default: [2] }, //0,1,2,3 => [BTC,ETH,USD,XMR]
        transaction_currencies: { type: [String], default: ["BTC", "ETH", "BCH", "XMR", "ZEC", "DASH", "LTC"] }
    },
    lastActiveInteractionAt: Date,
    eula: { type: Boolean, default: false },
    token: { type: String, default: '' }
}, { timestamps: true })

userSchema.pre('save', function (next) {
    this.lastActiveInteractionAt = Date.now();

    if (!this.settings.indicators) {
        this.settings.indicators = [
            { label: 'RSI', name: 'RSI', available: true, enabled: true },
            { label: 'Ichimoku', name: 'kumo_breakout', available: true, enabled: true },
            { label: 'ITF Proprietary 1', name: 'RSI_Cumulative', available: false, enabled: true },
            { label: 'Volume Based Indicator', name: 'VBI', available: false, enabled: true },]
    }
    next()
})

userSchema.pre('update', function (next) {
    this.lastActiveInteractionAt = Date.now();
    next()
})

var User = mongoose.model('User', userSchema)
module.exports = User