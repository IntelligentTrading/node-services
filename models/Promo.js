var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var promoSchema = new Schema({
    label: String,
    active: { type: Boolean, default: true },
    created: { type: Date, default: Date.now() },
    expiresOn: Date,
    totalVouchersAvailable: { type: Number, default: 100000 },
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

    var redeemedMessage = this.totalVouchersAvailable <= 0 ? this.label + ' is not active or available anymore!' : this.label + ' redeemed correctly!'
    var redeemed = this.totalVouchersAvailable > 0

    if (this.totalVouchersAvailable > 0 ) {
        this.totalVouchersRedeemed += 1
        this.totalVouchersAvailable -= 1
        console.log(`${redeemedMessage} [${telegram_chat_id}]`)
    }

    this.active = this.totalVouchersAvailable > 0 // add expiresOn control
    return { redeemed: redeemed, message: redeemedMessage }

}

var Promo = mongoose.model('Promo', promoSchema);
module.exports = Promo;