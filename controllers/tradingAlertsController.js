var TradingAlert = require('../models/TradingAlert')

module.exports = {
    addTradingAlert: (ta) => {
        return TradingAlert.create(ta)
    },
    getAll: () => {
        console.time('Loading top 100 trading alerts')
        return TradingAlert.find({}).sort({ signalId: -1 }).limit(100).then(result => {
            console.timeEnd('Loading top 100 trading alerts')
            return result
        })
    },
    getLastRejected:() =>{
        console.time('Loading rejections for trading alerts')
        return TradingAlert.$where('this.rejections.length > 5').sort({ signalId: -1 }).limit(1).then(result => {
            console.timeEnd('Loading rejections for trading alerts')
            return result
        })
    }
}