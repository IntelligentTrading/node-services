var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
    hash: String,
    blockNumber: Number
});

var Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;