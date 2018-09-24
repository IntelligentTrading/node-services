var _ = require('lodash')

class SignalWrapper {
    constructor(message_data, subscriptionTemplates, signalTemplate) {
        if (!subscriptionTemplates || !signalTemplate || !message_data)
            throw new Error('Invalid arguments provided to initialize the wrapper')

        this._subscriptionTemplates = subscriptionTemplates

        _.mapValues(signalTemplate, (v, k) => {
            this[k] = v
        })
        _.mapValues(message_data, (v, k) => {
            this[k] = v
        })

        this['isForFree'] = this.IsDeliverableTo('free')
        this['isForNonno'] = this.IsDeliverableTo('beta')
        this['isForStarter'] = this.IsDeliverableTo('paid')
        this['isForPro'] = this.IsDeliverableTo('diecimila')
        this['isForAdvanced'] = this.IsDeliverableTo('centomila')
    }

    IsDeliverableTo(pricingPlan) {

        if (pricingPlan == 'ITT') return true

        var template = this._subscriptionTemplates[pricingPlan]
        var isSubscribedToTickers = template.tickers.length == 0 || template.tickers.indexOf(this.transaction_currency) >= 0
        var canDeliverToLevel = this.deliverTo.indexOf(pricingPlan) >= 0
        var hasTheRightHorizon = !template.horizon || horizons.indexOf(this.horizon) <= horizons.indexOf(template.horizon)
        var isAllowedExchange = !template.exchanges || template.exchanges.length <= 0 || template.exchanges.indexOf(this.source.toLowerCase()) >= 0
        return isSubscribedToTickers && canDeliverToLevel && hasTheRightHorizon && isAllowedExchange
    }
}

module.exports = SignalWrapper