var TradingAlert = require('../models/TradingAlert')
var cache = require('../cache').redis
var moment = require('moment')

function loadCache() {
    return cache.getAsync('tradingAlerts').then(tradingAlerts => {
        if (tradingAlerts) return JSON.parse(tradingAlerts)
        else {
            return TradingAlert.find({'sent_at':{ $gt: moment().add(-4, 'hours').format('YYYY-MM-DD HH:MM') }}).then(alerts => {
                cache.set('tradingAlerts', JSON.stringify(alerts))
                var expdate = moment().add(4, 'hours').unix()
                cache.expireat('tradingAlerts', expdate)
                return alerts
            })
        }
    })
}

loadCache().then(() => console.log('Trading Alerts cache loaded.'))

module.exports = {
    addTradingAlert: (ta) => {
        return TradingAlert.create(ta)
    },
    getAll: () => {
        return loadCache()
    },
    getLastRejected: () => {
        console.time('Loading rejections for trading alerts')
        return loadCache().then(alerts => {
            console.timeEnd('Loading rejections for trading alerts')
            return alerts.filter(alert => alert.rejections.length > 5)
        })

        /*return TradingAlert.$where('this.rejections.length > 5').sort({ signalId: -1 }).limit(1)
        })*/
    }
}