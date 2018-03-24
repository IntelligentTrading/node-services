var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var colors = require('colors')
var sinon = require('sinon')
var walletCtrl = require('../controllers/walletController')
var UserModel = require('../models/User')
var crypto = require('crypto')
var ethers = require('ethers')
var ethUtils = require('ethers').utils

var etherscanRopstenProvider = new ethers.providers.EtherscanProvider(ethers.providers.networks.ropsten)

chai.use(chaiHttp)

var salt = process.env.WALLET_SALT
var secret = 'supersecret'

describe('Wallet Controller', () => {
    it('Throws exception if "secret" is null or undefined', () => {
        return expect(() => walletCtrl.getPrivateKeyFor()).to.throw('Secret must be provided')
    })

    it('Generates the same private key for chat_id and salt', () => {
        var privateKey1 = walletCtrl.getPrivateKeyFor(secret)
        var privateKey2 = `0x${crypto.createHmac('SHA256', salt + secret).digest('hex')}`
        return expect(privateKey1).to.be.equal(privateKey2)
    })

    it('Generates the same address for chat_id', () => {
        var privateKey = walletCtrl.getPrivateKeyFor(process.env.TELEGRAM_TEST_CHAT_ID)
        var wallet1 = walletCtrl.getWalletAddressFor(process.env.TELEGRAM_TEST_CHAT_ID)
        var wallet2 = walletCtrl.getWalletAddressFor(process.env.TELEGRAM_TEST_CHAT_ID)
        return expect(wallet2).to.be.equal(wallet1)
    })

    it('Has balance on Ropsten', () => {
        var wallet = walletCtrl.getWalletFor(process.env.TELEGRAM_TEST_CHAT_ID)
        wallet.provider = etherscanRopstenProvider
        var balancePromise = wallet.getBalance()
        return balancePromise.then(balance => {
            var ethBalance = ethUtils.formatEther(balance)
            return expect(parseFloat(ethBalance) >= 0)
        })
    })
})