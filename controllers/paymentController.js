var ethers = require('ethers')
var etherscanProvider = new ethers.providers.EtherscanProvider(ethers.providers.networks.ropsten)
var UserModel = require('../models/User')

module.exports = paymentController = {
    watch: (txHash) => {
        return etherscanProvider.waitForTransaction(txHash).then((transaction) => {
            return transaction
        })
    },
    addSubscriptionDays: (days, telegram_chat_id) => {
        return UserModel.findOne({ telegram_chat_id: telegram_chat_id })
            .then(user => {
                var newDate = new Date()
                if (user.settings.subscriptions.paid.getDate())
                    newDate.setUTCDate(user.settings.subscriptions.paid.getDate() + days)
                else
                    newDate.setUTCDate(newDate.getDate() + days)

                return UserModel.update({ telegram_chat_id: telegram_chat_id }, { 'settings.subscriptions.paid': newDate })

            })
    },
    isAlreadyVerified: (txHash, telegram_chat_id) => {
        return UserModel.findOne({ telegram_chat_id: telegram_chat_id }).then(user => {
            return user.settings.ittTransactions.length > 0 && user.settings.ittTransactions.indexOf(txHash) >= 0
        })
    },
    addTransactionToList: (txHash, telegram_chat_id) => {
        return UserModel.findOne({ telegram_chat_id: telegram_chat_id }).then(user => {

            if (user) {
                user.settings.ittTransactions.push(txHash)
                user.save()
                return user
            }
        })
    },
    watchApi: (req, res) => {
        var txHash = req.body.txHash
        var telegram_chat_id = req.body.telegram_chat_id
        return paymentController.isAlreadyVerified(txHash, telegram_chat_id)
            .then(isVerified => {
                if (!isVerified) {
                    return paymentController.watch(txHash).then(tx => {
                        return paymentController.addTransactionToList(txHash, telegram_chat_id)
                            .then(() => {
                                var ethereumValue = ethers.utils.formatEther(tx.value._bn);
                                return paymentController.addSubscriptionDays(parseFloat(ethereumValue), telegram_chat_id)
                                    .then(() => {
                                        res.send(tx)
                                    })
                            })
                    })
                }
                else {
                    return res.status(500).send('You cannot verify a transaction more than once')
                }
            }).catch(err => {
                res.status(500).send(err.message)
            })
    }
}