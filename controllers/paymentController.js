var ethers = require('ethers')
var network = process.env.LOCAL_ENV ? ethers.providers.networks.ropsten : undefined
var etherscanProvider = new ethers.providers.EtherscanProvider(network)
var UserModel = require('../models/User')
var dates = require('../util/dates')
var wallet = require('./walletController')
var abi = require('../util/abi')

var ittContractAddress = process.env.CONTRACT_ADDRESS
var contract = new ethers.Contract(ittContractAddress, abi, etherscanProvider)

module.exports = paymentController = {
    getUserStatus: async (telegram_chat_id) => {
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        if (!user) throw new Error('User not found')

        var expirationDate = user.settings.subscriptions.paid
        var daysLeft = dates.getDaysLeftFrom(expirationDate)

        return {
            telegram_chat_id: telegram_chat_id,
            expirationDate: expirationDate,
            subscriptionDaysLeft: daysLeft,
            plan: user.settings.subscription_plan
        }
    },
    addSubscriptionDays: async (days, telegram_chat_id) => {
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        if (!user) throw new Error('User not found')

        var newExpirationDate = new Date(Math.max(new Date(), user.settings.subscriptions.paid) + dates.daysToMillis(days))
        await UserModel.update({ telegram_chat_id: telegram_chat_id }, { 'settings.subscriptions.paid': newExpirationDate })
    },
    isAlreadyVerified: (txHash, telegram_chat_id) => {
        return UserModel.findOne({ telegram_chat_id: telegram_chat_id }).then(user => {
            return user.settings.ittTransactions.length > 0 && user.settings.ittTransactions.indexOf(txHash) >= 0
        })
    },
    addTransactionToList: async (txHash, telegram_chat_id) => {
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        if (user) {
            user.settings.ittTransactions.push(txHash)
            user.save()
            return user
        }
    },
    verifyTx: async (txHash, telegram_chat_id) => {

        var isAlreadyVerified = await paymentController.isAlreadyVerified(txHash, telegram_chat_id)
        if (isAlreadyVerified)
            throw new Error('You cannot verify a transaction more than once')

        var tx = await etherscanProvider.waitForTransaction(txHash)

        if (tx.to.toLowerCase() != ittContractAddress.toLowerCase())
            throw new Error('You can verify only ITT transactions!')

        var txInfo = await txInfoFromRawData(tx.data)
        checkReceivingAddress(telegram_chat_id, txInfo.receiverAddress)

        await paymentController.addTransactionToList(txHash, telegram_chat_id)
        await paymentController.addSubscriptionDays(txInfo.ittTokens, telegram_chat_id)
        return tx
    },
    txInfoFromRawData: (txData) => {
        var meaningfulInfo = txData.substring(txData.length - 128)
        var transferredTokenData = meaningfulInfo.substring(64)
        return contract.decimals()
            .then(decimalPlacesInfo => {
                return {
                    receiverAddress: meaningfulInfo.substring(0, 64),
                    ittTokens: parseInt(transferredTokenData, 16) / (10 ** parseInt(decimalPlacesInfo[0]))
                }
            })
    },
    checkReceivingAddress: (telegram_chat_id, txReceiverAddress) => {
        // ERC20 address is 160 bit in hex representation (40 chars) + a prefix (0x)
        var expectedReceiverAddressx0 = wallet.getWalletAddressFor(telegram_chat_id)
        // the transaction log instead uses 64 chars, so we have to drop the first 24 and add the prefix
        var txReceiverAddress_0x = '0x' + txReceiverAddress.substring(24)

        if (expectedReceiverAddressx0.toLowerCase() != txReceiverAddress_0x.toLowerCase())
            throw new Error(`The receiver address ${txReceiverAddress_0x} of this transaction does not match your ITT wallet receiver address!`)

        return true
    }
}