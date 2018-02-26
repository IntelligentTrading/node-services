var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cryptofeedSchema = new Schema({
    feedId: Number,
    ittBullish: [Number],
    ittBearish: [Number],
    ittImportant: [Number],
    url: String,
    votes: {
        positive: Number,
        negative: Number,
        important: Number
    },
    timestamp: Date,
    news: String
});


var CryptoFeed = mongoose.model('CryptoFeed', cryptofeedSchema);

module.exports = CryptoFeed;