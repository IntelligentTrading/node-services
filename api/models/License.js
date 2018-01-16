var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var licenseSchema = new Schema({
    plan: String,
    code: String,
    created: { type: Date, default: Date.now() },
    redeemed: { type: Boolean, default: false }
});


var License = mongoose.model('License', licenseSchema);
module.exports = License;