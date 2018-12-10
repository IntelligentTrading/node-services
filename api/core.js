var rpromise = require('request-promise')
var coreApiVersion = 'v2'
var coreApiUrl = `https://${process.env.ITT_API_HOST}/${coreApiVersion}`
var coreApiKey = process.env.ITT_API_KEY

module.exports = {
    get: (partial_url) => {
        if (partial_url[0] == '/') partial_url = partial_url.slice(1)

        var request_url = `${coreApiUrl}/${partial_url}`
        return rpromise(request_url, { headers: { "Authorization": `Token ${coreApiKey}` } })
    }
}