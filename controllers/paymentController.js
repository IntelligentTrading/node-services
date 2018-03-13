var ethers = require('ethers')
var etherscanProvider = new ethers.providers.EtherscanProvider()//ethers.providers.networks.ropsten)
var UserModel = require('../models/User')
var dates = require('../util/dates')

var ittContractAddress = '0x0aeF06DcCCC531e581f0440059E6FfCC206039EE'

module.exports = paymentController = {
    watch: (txHash) => {
        return etherscanProvider.waitForTransaction(txHash).then((transaction) => {
            return transaction
        })
    },
    receipt: (txHash) => {
        return etherscanProvider.getTransactionReceipt(txHash).then(receipt => {
            return receipt
        })
    },
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
    watchApi: async (req, res) => {
        try {
            var txHash = req.body.txHash
            var telegram_chat_id = req.body.telegram_chat_id
            var isAlreadyVerified = await paymentController.isAlreadyVerified(txHash, telegram_chat_id)
            if (!isAlreadyVerified) {
                var tx = await paymentController.watch(txHash)

                if (tx.to != ittContractAddress)
                    throw new Error('You can verify only ITT transactions!')

                await paymentController.addTransactionToList(txHash, telegram_chat_id)
                var ittValue = ittTokensFromData(tx.data)
                await paymentController.addSubscriptionDays(ittValue, telegram_chat_id)
                res.send(tx)
            }
            else {
                res.status(500).send('You cannot verify a transaction more than once')
            }
        } catch (err) {
            res.status(500).send(err.message)
        }
    },
    receiptApi: (req, res) => {
        var txHash = req.params.txHash
        paymentController.receipt(txHash)
            .then(receipt => { res.send(receipt) })
            .catch(err => res.status(500).send(err))
    },
    getUserStatusApi: (req, res) => {
        var telegram_chat_id = req.params.telegram_chat_id
        paymentController.getUserStatus(telegram_chat_id)
            .then(status => res.send(status))
            .catch(err => res.status(500).send(err.message))
    },
    ToIttTokens: (txData) => ittTokensFromData(txData)
}

var ittTokensFromData = (txData) => {
    var tokensData = txData.substring(txData.length - 64)
    var ittString = parseInt(tokensData, 16)
    var decimalPlaces = 100000000
    //! This conversion could change if ITT changes the decimal places in the contract
    return ittString / decimalPlaces
}