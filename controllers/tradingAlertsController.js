var TradingAlert = require('../models/TradingAlert')

module.exports = {
    addTradingAlert: (ta) => {
        return TradingAlert.create(ta)
    },
    getAll: () => {
        return TradingAlert.find({}).sort({ signalId: -1 }).limit(100)
    }
}