var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscriptionTemplateSchema = new Schema({
    label: String, //free
    tickers: [String],
    exchanges: [String],
    horizon: String,
    counter: [Number]
})

var SubscriptionTemplate = mongoose.model('SubscriptionTemplate', subscriptionTemplateSchema);
module.exports = SubscriptionTemplate;