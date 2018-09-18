
var marketApi = require('../api/market')
var usersController = require('../controllers/usersController')

var marketApiPromise = marketApi.init()
var usersPromise = usersController.all()

module.exports = {
    load: () => {
        return Promise.all([marketApiPromise, usersPromise])
    }
}