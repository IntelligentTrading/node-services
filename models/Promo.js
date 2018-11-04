var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var promoSchema = new Schema({
    label: String,
    active: { type: Boolean, default: true },
    created: { type: Date, default: Date.now() },
    expiresOn: Date,
    totalVouchersAvailable: Number,
    totalVouchersRedeemed: { type: Number, default: 0 },
    voucherValue: { type: Number, default: 7 },
    voucherUnit: { type: String, default: 'D' }, // 7 Days
    code: { type: String, required: true }
});

promoSchema.methods.toDays = function () {
    if (this.voucherUnit == 'D') return this.voucherValue
    return this.voucherValue
}

promoSchema.methods.redeem = function (telegram_chat_id) {
    this.totalVouchersRedeemed += 1
    if (this.totalVouchersAvailable) {
        this.totalVouchersAvailable -= 1
        this.active = this.totalVouchersAvailable > 0
    }
    console.log(`${this.label} redeemed by ${telegram_chat_id}`)
}

var Promo = mongoose.model('Promo', promoSchema);
module.exports = Promo;