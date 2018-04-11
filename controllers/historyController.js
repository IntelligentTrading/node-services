var rp = require('request-promise')
var templateHelper = require('../util/signalTemplate')

var core_api_version = 'v2'
var core_api_url = `https://${process.env.ITT_API_HOST}/${core_api_version}`
var core_api_key = process.env.ITT_API_KEY

module.exports = {
    getSignalHistory: (queryParametersObject) => {
        var request_url = `${core_api_url}/signals/`
        if (queryParametersObject) {
            var filters = []
            Object.keys(queryParametersObject).forEach(property => {
                filters.push(`${property}=${queryParametersObject[property]}`)
            })
            var queryParameters = filters.join('&')
            request_url = `${request_url}?${queryParameters}`
        }
        return rp(request_url, { headers: { 'API-KEY': core_api_key } })
    },
    applyTemplate: (signal) => templateHelper.applyTemplate(signal)
}