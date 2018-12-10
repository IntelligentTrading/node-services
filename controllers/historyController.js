var rp = require('request-promise')
var templateHelper = require('../dispatching/signal-helper')

var coreApiVersion = 'v2'
var coreApiUrl = `https://${process.env.ITT_API_HOST}/${coreApiVersion}`
var coreApiKey = process.env.ITT_API_KEY

module.exports = {
    getSignalHistory: (queryParametersObject) => {
        var request_url = `${coreApiUrl}/signals/`
        if (queryParametersObject) {
            var filters = []
            Object.keys(queryParametersObject).forEach(property => {
                filters.push(`${property}=${queryParametersObject[property]}`)
            })
            var queryParameters = filters.join('&')
            request_url = `${request_url}?${queryParameters}`
        }
        return rp(request_url, { headers: { "Authorization": `Token ${coreApiKey}` } })
    },
    applyTemplate: (signal) => templateHelper.applyTemplate(signal)
}