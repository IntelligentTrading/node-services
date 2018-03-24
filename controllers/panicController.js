var CryptoFeedModel = require('../models/CryptoFeed')

module.exports = {
    updateNewsFeed: (feed) => {

        var pushClause = {};
        if (feed.ittBullish)
            pushClause.ittBullish = { $each: feed.ittBullish }
        if (feed.ittBearish)
            pushClause.ittBearish = { $each: feed.ittBearish }
        if (feed.ittImportant)
            pushClause.ittImportant = { $each: feed.ittImportant }

        return CryptoFeedModel.findOneAndUpdate({ feedId: feed.feedId }, { $push: pushClause }, { new: true })
    },
    saveNewsFeed: (feed) => {
        return CryptoFeedModel.create(feed)
    }
}