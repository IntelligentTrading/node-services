var TradingAlert = require('../models/TradingAlert')

module.exports = {
    addTradingAlert: (ta) => {
        return TradingAlert.create(ta)
    },
    getAll: () => {
        return TradingAlert.find({})
    }
}