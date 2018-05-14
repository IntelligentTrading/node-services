// Copied by https://gist.github.com/dotcypress/8fd12d6e886cd74bba8f1aa8dbd346aa,

const { createHash, createHmac } = require('crypto');

// I prefer get the secret's hash once but check the gist linked
// on line 1 if you prefer passing the bot token as a param
const secret = createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest()

module.exports = {
    isSignatureValid: ({ hash, ...data }) => {
        const checkString = Object.keys(data)
            .sort()
            .map(k => (`${k}=${data[k]}`))
            .join('\n');
        const hmac = createHmac('sha256', secret)
            .update(checkString)
            .digest('hex');
        return hmac === hash;
    }
}