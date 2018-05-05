var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tradingAlertSchema = new Schema({
    signalId: Number,
    rejections: [Number], //chat ids with error
    reasons: [String]
});


var TradingAlert = mongoose.model('TradingAlert', tradingAlertSchema);
module.exports = TradingAlert;