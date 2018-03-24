var crypto = require('crypto')
var ethersjs = require('ethers')
var Wallet = ethersjs.Wallet

module.exports = ctrl = {
    getPrivateKeyFor: (secret) => {
        if (!secret) throw new Error('Secret must be provided')
        return `0x${crypto.createHmac('SHA256', process.env.WALLET_SALT + secret).digest('hex')}`
    },
    getWalletFor: (chat_id) => {
        return new Wallet(ctrl.getPrivateKeyFor(chat_id))
    },
    getWalletAddressFor: (chat_id) => {
        return new Wallet(ctrl.getPrivateKeyFor(chat_id)).address
    }
}