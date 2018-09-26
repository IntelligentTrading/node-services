var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var referral = require('../util/referral')
var walletController = require('../controllers/walletController')
var eventBus = require('../events/eventBus')

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
        staking: {
            walletAddress: { type: String },
            diecimila: { type: Boolean, default: false },
            centomila: { type: Boolean, default: false },
            confirmationCode: String,
            veriSigned: { type: Boolean, default: false }
        },
        subscriptions: {
            free: { type: Date, default: new Date(2020, 12, 31) },
            beta: { type: Date, default: Date.now() },
            paid: { type: Date, default: Date.now() }
        },
        indicators: [{
            label: { type: String }, name: { type: String }, available: { type: Boolean }, enabled: { type: Boolean },
        }],
        exchanges: [{
            label: { type: String }, index: { type: Number }, enabled: { type: Boolean },
        }],
        ittTransactions: [{ tx: { type: String }, total: { type: Number } }],
        subscriptionRenewed: { plan: String, on: Date },
        lastSignalReceived: { signalId: String, on: Date },
        ittWalletReceiverAddress: { type: String, default: 'No address generated' },
        counter_currencies: { type: [Number], default: [2] }, //0,1,2,3 => [BTC,ETH,USD,XMR]
        transaction_currencies: { type: [String], default: ["BTC", "ETH", "BCH", "XMR", "ZEC", "DASH", "LTC"] },
        referral: String,
        referred_by_code: String,
        referred_count: { type: Number, default: 0 },
    },
    lastActiveInteractionAt: Date,
    eula: { type: Boolean, default: false },
    token: { type: String, default: '' }
}, { timestamps: true })

userSchema.pre('save', function (next) {
    this.lastActiveInteractionAt = Date.now();

    if (!this.settings.indicators || this.settings.indicators.length <= 0) {
        this.settings.indicators = [
            { label: 'RSI', name: 'RSI', available: true, enabled: true },
            { label: 'Ichimoku', name: 'kumo_breakout', available: true, enabled: true },
            { label: 'ITF Proprietary 1', name: 'RSI_Cumulative', available: false, enabled: true },
            { label: 'Volume Based Indicator', name: 'VBI', available: false, enabled: true },]
    }

    if (!this.settings.exchanges || this.settings.exchanges.length <= 0) {
        this.settings.exchanges = [
            { label: 'Poloniex', index: 0, enabled: true },
            { label: 'Bittrex', index: 1, enabled: true },
            { label: 'Binance', index: 2, enabled: true }]
    }

    if (!this.settings.referral) {
        this.settings.referral = referral.referralGenerator(this.telegram_chat_id)
        this.settings.referred_count = 0
    }

    if (!this.settings.ittWalletReceiverAddress || this.settings.ittWalletReceiverAddress == 'No address generated') {
        this.settings.ittWalletReceiverAddress = walletController.getWalletAddressFor(this.telegram_chat_id)
    }

    next()
})

userSchema.pre('update', function (next) {
    this.lastActiveInteractionAt = Date.now();
    next()
})

userSchema.post('save', function (u) {
    //eventBus.emit('userSaved', u)
    eventBus.emit('cacheUser',u)
});

userSchema.post('update', function () {
    console.log('Post update')
})

var User = mongoose.model('User', userSchema)
module.exports = User