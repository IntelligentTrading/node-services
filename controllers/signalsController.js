var Signal = require('../models/Signal')
var cache = require('../cache').redis
var moment = require('moment')

function loadSignalsFromDB() {
    return Signal.find().then(signals => {
        cache.set('signals', JSON.stringify(signals))
        var expdate = moment().add(24, 'hours').unix()
        cache.expireat('signals', expdate)
    })
}

cache.getAsync('signals').then(signals => {
    if (!signals) {
        loadSignalsFromDB().then(() =>
            console.log('Signals cache initialized from DB.'))
    }
    console.log('Signals cache initialized.')
})

module.exports = {
    getSignals: (signalLabel) => {
        var clause = {};

        if (signalLabel)
            clause['label'] = signalLabel

        return cache.getAsync('signals').then(signals => {
            if (signals) {
                signals = JSON.parse(signals)
                return signalLabel ? signals.filter(s => s.label == signalLabel) : signals
            }
            else {
                return Signal.find(clause)
            }
        })
    },
}