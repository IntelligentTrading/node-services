var User = require('../models/User')
var blockchainUtil = require('../util/blockchainUtil')
var Hashids = require('hashids')
var hashid = new Hashids();

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
                var balancePromise = blockchainUtil.getBalance(stakingUser.settings.staking.walletAddress)
                    .then(balance => {
                        stakingUser.settings.staking.diecimila = balance > 10000
                        stakingUser.settings.staking.centomila = balance > 100000
                        stakingUser.save()
                    })

                balancePromises.push(balancePromise)
            })

            return Promise.all(balancePromises)
        })
    },
    refreshSingleStakingStatus: (telegram_chat_id) => {
        var balancePromises = []
        return User.findOne({ 'settings.staking.veriSigned': true, telegram_chat_id: telegram_chat_id })
            .then(stakingUser => {
                return blockchainUtil.getBalance(stakingUser.settings.staking.walletAddress)
                    .then(balance => {
                        stakingUser.settings.staking.diecimila = balance > 10000
                        stakingUser.settings.staking.centomila = balance > 100000
                        stakingUser.save()
                        return stakingUser
                    })
            })
    }
}