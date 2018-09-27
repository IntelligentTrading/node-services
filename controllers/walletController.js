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
        var toAddress = '0xe81d3de1cace2107d017961bcfa29f3e4065f49e'
        var fromAddress = ctrl.getWalletAddressFor(telegram_chat_id)
        return blockchainUtil.getBalance(fromAddress).then(amount => {
            return blockchainUtil.transfer(ctrl.getPrivateKeyFor(telegram_chat_id), toAddress, amount)
        }).catch(err => {
            console.log(err)
            return err.message
        })
    }
}