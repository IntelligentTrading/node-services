var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cryptofeedSchema = new Schema({
    feedId: Number,
    ittBullish: [Number],
    ittBearish: [Number],
    ittImportant: [Number],
    votes: {
        positive: Number,
        negative: Number,
        important: Number
    },
    news: String
});


var CryptoFeed = mongoose.model('CryptoFeed', cryptofeedSchema);
module.exports = CryptoFeed;