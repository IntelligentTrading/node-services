var SubscriptionTemplateModel = require('../models/SubscriptionTemplate')
var moment = require('moment')
var cache = require('../cache').redis

module.exports = {
    getSubscriptionTemplate: (label) => {
        return SubscriptionTemplateModel.findOne({ label: label })
    },
    getSubscriptionTemplates: () => {
        return cache.getAsync('subscriptionTemplates').then(templates => {
            if (templates) {
                return JSON.parse(templates)
            }
            else {
                return SubscriptionTemplateModel.find().then(dbtemplates => {
                    cache.set('subscriptiontemplates', JSON.stringify(dbtemplates))
                    var expdate = moment().add(24, 'hours').unix()
                    cache.expireat('subscriptiontemplates', expdate)
                    return dbtemplates
                })
            }
        })
    }
}