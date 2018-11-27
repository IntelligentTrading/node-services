var rp = require('request-promise')

module.exports = {
    assets: async () => {
        const result = await rp('https://api.coincap.io/v2/assets?limit=2000');
        return JSON.parse(result).data;
    }
}