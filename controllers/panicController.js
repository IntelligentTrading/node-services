module.exports = {
    updateNewsFeed: (req, res) => {
        solve(dbApi.updateNewsFeed(req.body))
    },
    saveNewsFeed: (req, res) => {
        solve(dbApi.saveNewsFeed(req.body))
    }
}

var solve = (res, promise) => {

    promise.then(result => {
        console.log(result)
        return res.sendStatus(201)
    }).catch(err => {
        console.log(err)
        return res.sendStatus(500);
    })
}