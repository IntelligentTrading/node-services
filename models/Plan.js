var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var planSchema = new Schema({
    plan: String,
    signals: [String],
    accessLevel: Number
});


var Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;