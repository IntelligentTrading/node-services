
//var marketApi = require('../api/market')
var usersController = require('../controllers/usersController')

var cacheableControllers = []
cacheableControllers.push(usersController.all())

module.exports = {
    load: () => {
        return Promise.all(cacheableControllers)
    }
}