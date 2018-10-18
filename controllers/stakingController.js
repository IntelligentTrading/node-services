var User = require('../models/User')
var blockchainUtil = require('../util/blockchainUtil')
var Hashids = require('hashids')
var hashid = new Hashids();
var moment = require('moment')
var _ = require('lodash')

var DIECIMILA_THRESHOLD = process.env.ETH_TEST ? 4 : 10000
var CENTOMILA_THRESHOLD = process.env.ETH_TEST ? 5 : 100000

module.exports = stakingController = {
    addWallet: (telegram_chat_id, wallet) => {
        if (telegram_chat_id && blockchainUtil.isAddress(wallet)) {
            return User.findOne({ telegram_chat_id: telegram_chat_id }).then(user => {
                user.settings.staking.walletAddress = wallet
                user.settings.staking.confirmationCode = hashid.encode(telegram_chat_id)
                user.settings.staking.diecimila = false
                user.settings.staking.centomila = false
                user.settings.staking.veriSigned = false
                user.save()
                return user.settings.staking.confirmationCode
            })
        }
    },
    verify: (telegram_chat_id, signature) => {
        return User.findOne({ telegram_chat_id: telegram_chat_id }).then(user => {
            var verificationResult = blockchainUtil.verifySignature(signature, user.settings.staking.walletAddress, user.settings.staking.confirmationCode)
            user.settings.staking.veriSigned = verificationResult.verified
            user.save()
            return verificationResult
        })
    },
    refreshStakingStatus: () => {
        var balancePromises = []
        return User.find({ 'settings.staking.veriSigned': true }).then(stakingUsers => {
            stakingUsers.forEach(stakingUser => {
                var balancePromise = stakingController.updateStakingFor(stakingUser)
                balancePromises.push(balancePromise)
            })

            return Promise.all(balancePromises)
        })
    },
    refreshSingleStakingStatus: (telegram_chat_id) => {
        return User.findOne({ 'settings.staking.veriSigned': true, telegram_chat_id: telegram_chat_id })
            .then(stakingUser => {
                return stakingController.updateStakingFor(stakingUser)
            })
    },
    updateStakingFor: (user) => {
        if (!user.settings.staking || !user.settings.staking.walletAddress)
            return user

        return blockchainUtil.getBalance(user.settings.staking.walletAddress)
            .then(balance => {

                var totalIttSent = _.sum(user.settings.ittTransactions.map(tx => tx.total_in_itt))

                user.settings.staking.lastRetrievedBalance = balance
                user.settings.staking.diecimila = balance + totalIttSent >= DIECIMILA_THRESHOLD
                user.settings.staking.centomila = balance + totalIttSent >= CENTOMILA_THRESHOLD

                // user becomes stakeholder but it doesn't lose the previous subscription
                if (user.settings.staking.diecimila && !user.settings.subscriptions.frozen) {
                    var leftoverHours = moment().diff(settings.subscriptions.paid, "hours")
                    if (leftoverHours > 0) {
                        user.settings.subscriptions.frozenHours = leftoverHours
                        user.settings.subscriptions.frozen = true
                    }
                }

                // restore previous subscription in case staking is broken
                if (!user.settings.staking.diecimila && user.settings.subscriptions.frozen) {
                    user.settings.subscriptions.paid = moment().add(user.settings.subscriptions.frozenHours, 'hours')
                    user.settings.subscriptions.frozen = false
                    user.settings.subscriptions.frozenHours = 0
                }

                user.save()
                return user
            })
    },
    balanceFor: (address) => {
        return blockchainUtil.getBalance(address).then(ittBalance => { return { ittBalance: ittBalance } })
    }
}