var signalsCtrl = require('../controllers/signalsController')
var SubscriptionTemplateModel = require('../models/SubscriptionTemplate')

var signalTypes = []
var subscriptionTemplates = []
var horizons = ['long', 'medium', 'short']
var exchanges = ['poloniex', 'bittrex', 'binance']

module.exports = {
    analyze: async (signal) => {
        if (signalTypes.length == 0) {
            signalTypes = await signalsCtrl.getSignals()
        }
        if (subscriptionTemplates.length == 0) {
            subscriptionTemplates = await SubscriptionTemplateModel.find({})
        }

        return {
            isForFree: isForFree(signal),
            isForNonno: isForNonno(signal),
            isForTier: isForTier(signal)
        }
    }
}


function isForFree(signal) {

    var isUptrend = signal.trend > 0
    var isUSDT = signal.counter_currency == 2

    return IsDeliverableTo('free', signal) && isUptrend && isUSDT
}

function isForNonno(signal) {
    return IsDeliverableTo('beta', signal)
}

function isForTier(signal) {
    return IsDeliverableTo('paid', signal)
}

function IsDeliverableTo(pricingPlan, signal) {

    var signalType = signalTypes.find(st => st.label == signal.signal)
    if (!signalType) return false

    var template = subscriptionTemplates.find(st => st.label == pricingPlan)
    var isSubscribedToTickers = template.tickers.length == 0 || template.tickers.indexOf(signal.transaction_currency) >= 0
    var canDeliverToLevel = signalType.deliverTo.indexOf(pricingPlan) >= 0
    var hasTheRightHorizon = !template.horizon || horizons.indexOf(signal.horizon) <= horizons.indexOf(template.horizon)
    var isAllowedExchange = !template.exchanges || template.exchanges.length <= 0 || template.exchanges.indexOf(exchanges[signal.source]) >= 0
    return isSubscribedToTickers && canDeliverToLevel && hasTheRightHorizon && isAllowedExchange
}