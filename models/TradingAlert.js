var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tradingAlertSchema = new Schema({
    signalId: Number,
    awsSQSId: String,
    rejections: [Number], //chat ids with error
    reasons: [String],
    sent_at: Date
});


var TradingAlert = mongoose.model('TradingAlert', tradingAlertSchema);
module.exports = TradingAlert;