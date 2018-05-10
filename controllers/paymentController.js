var ethers = require('ethers')
const bot = require('../util/telegramBot').bot
const broadcast_markdown_opts = require('../util/telegramBot').markdown
const nopreview_markdown_opts = require('../util/telegramBot').nopreview_markdown_opts

var network = process.env.LOCAL_ENV ? ethers.providers.networks.ropsten : ethers.providers.networks.mainnet
console.log(`Deploying blockchain provider on ${network.name}`)
var etherscanProvider = new ethers.providers.EtherscanProvider(network)

var coinmarketcap = require('../api/coinmarketcap')
var marketApi = require('../api/market')
var UserModel = require('../models/User')
var dates = require('../util/dates')
var wallet = require('./walletController')
var abi = require('../util/abi')
var ittContractAddress = process.env.CONTRACT_ADDRESS
var contract = new ethers.Contract(ittContractAddress, abi, etherscanProvider)
var itfEmitter = require('../util/blockchainNotifier')

var walletController = require('./walletController')

itfEmitter.on('itfTransfer', tx => {
    console.log(`[Event] verifying transaction ${tx.transactionHash}`)
    verifyTransaction(tx).then(user => {
        if (user) {
            var expDate = user.settings.subscriptions.paid
            bot.sendMessage(user.telegram_chat_id, `Subscription | Transaction confirmed

[Transaction info](https://etherscan.io/tx/${tx.transactionHash})
Premium signals days: ${dates.getDaysLeftFrom(expDate)}
Starter plan expires on: ${expDate.toDateString()}
Configure your preferences with the /wizard!`, nopreview_markdown_opts)
        }
    }).catch(err => { console.log(err) })
})

module.exports = paymentController = {
    getUserStatus: async (telegram_chat_id) => {
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        if (!user || user.length < 0) throw new Error('User not found')

        var expDate = user.settings.subscriptions.paid

        return {
            telegram_chat_id: telegram_chat_id,
            expirationDate: expDate,
            subscriptionDaysLeft: Math.max(0, dates.getDaysLeftFrom(expDate)),
            walletAddress: user.settings.ittWalletReceiverAddress
        }
    },
    verifyTransaction: (transaction) => verifyTransaction
}

function verifyTransaction(transaction) {
    return UserModel.findOne({ 'settings.ittWalletReceiverAddress': transaction.returnValues.to })
        .then(user => {

            if (user && user.settings.ittTransactions.indexOf(transaction.transactionHash) < 0) {

                var weiToTokenPromise = weiToToken(transaction.returnValues.value)
                var marketApiPromise = marketApi.itt()

                return Promise.all([weiToTokenPromise, marketApiPromise])
                    .then(fulfillments => {
                        var tokens = fulfillments[0]
                        var itt = JSON.parse(fulfillments[1])
                        //20$ in ITT = 1 month
                        var usdPricePerSecond = 20 * 12 / 365.25 / 24 / 3600
                        //100ITT * 0.04 = 4$
                        var ittSeconds = tokens * itt.close / usdPricePerSecond
                        var startingDate = new Date(Math.max(new Date(), user.settings.subscriptions.paid))
                        var newExpirationDate = startingDate.setSeconds(startingDate.getSeconds() + ittSeconds)
                        user.settings.subscriptions.paid = newExpirationDate
                        user.settings.ittTransactions.push({ tx: transaction.transactionHash, total: tokens })
                        user.save()
                        return user
                    }).catch(err => {
                        console.log(err)
                    })
            }
        })
}

function weiToToken(weiValue) {
    return contract.decimals().then(decimalPlacesInfo => {
        return parseInt(weiValue) / (10 ** parseInt(decimalPlacesInfo))
    })
}