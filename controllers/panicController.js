var CryptoFeedModel = require('../models/CryptoFeed')

module.exports = {
    updateNewsFeed: (req, res) => {
        solve(res, updateNewsFeed(req.body))
    },
    saveNewsFeed: (req, res) => {
        solve(res, saveNewsFeed(req.body))
    }
}

var saveNewsFeed = (feed) => {
    return CryptoFeedModel.create(feed).then(f => { return f })
}

var updateNewsFeed = (feed) => {

    var pushClause = {};
    if (feed.ittBullish)
        pushClause.ittBullish = { $each: feed.ittBullish }
    if (feed.ittBearish)
        pushClause.ittBearish = { $each: feed.ittBearish }
    if (feed.ittImportant)
        pushClause.ittImportant = { $each: feed.ittImportant }

    return CryptoFeedModel.findOneAndUpdate({ feedId: feed.feedId }, { $push: pushClause }, { new: true })
        .then(f => { return f })
}

var solve = (res, promise) => {

    promise.then(result => {
        return res.status(200).send(result)
    }).catch(err => {
        console.log(err)
        return res.sendStatus(500);
    })
}