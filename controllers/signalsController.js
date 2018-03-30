var Signal = require('../models/Signal')

module.exports = {
    getSignals: (signal) => {
        var clause = {};

        if (signal)
            clause['label'] = signal

        return Signal.find(clause)
    }
}