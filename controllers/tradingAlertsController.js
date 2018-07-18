var TradingAlert = require('../models/TradingAlert')

module.exports = {
    addTradingAlert: (ta) => {
        return TradingAlert.create(ta)
    },
    getAll: () => {
        return TradingAlert.find({}).sort({ signalId: -1 }).limit(100)
    },
    getLastRejected:() =>{
        return TradingAlert.$where('this.rejections.length > 5').sort({ signalId: -1 }).limit(1)
    }
}