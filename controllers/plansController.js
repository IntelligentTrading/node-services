var Plan = require('../models/Plan')

module.exports = {
    getPlans: (signal) => {
        var clause = {};

        if (signal)
            clause['signals'] = signal

        return Plan.find(clause)
    }
}