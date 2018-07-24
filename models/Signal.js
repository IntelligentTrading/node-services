var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var signalSchema = new Schema({
    label: String,
    deliverTo: [String],
    guide_url: String
});


var Signal = mongoose.model('Signal', signalSchema);
module.exports = Signal;