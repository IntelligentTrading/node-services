var rpromise = require('request-promise');
var api_url = `https://${process.env.ITT_API_HOST}`;
var api_key = process.env.ITT_API_KEY;

var api = {
    eula: (chat_id) => {

        var request_opts = {
            uri: `${api_url}/user`,
            method: 'POST',
            form: { chat_id: chat_id, eula: 'True' },
            resolveWithFullResponse: true,
            headers: {
                'API-KEY': api_key
            }
        }

        return rpromise(request_opts);
    }
}

exports.bot_api = api;