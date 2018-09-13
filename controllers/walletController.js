var crypto = require('crypto')
var ethersjs = require('ethers')
var Wallet = ethersjs.Wallet
var blockchainUtil = require('../util/blockchainUtil')

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
    },
    toHotWallet: (telegram_chat_id) => {
        var toAddress = '0xb909b0cB136066bBcC5eE54f4610D7fA8162191E'
        var fromAddress = ctrl.getWalletAddressFor(telegram_chat_id)
        return blockchainUtil.getBalance(fromAddress).then(amount => {
            return blockchainUtil.transfer(toAddress, fromAddress, amount)
        }).catch(err => {
            console.log(err)
            return err.message
        })
    }
}