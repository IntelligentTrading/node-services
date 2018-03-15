var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var colors = require('colors')
var sinon = require('sinon')
var paymentCtrl = require('../controllers/paymentController')
var UserModel = require('../models/User')

chai.use(chaiHttp)

var sampleTx = '0x97e52d6a21e94566b1174e5adb0b853a3fde7434031a99cdae10eff2300d33c8'
var ittTokenSent = 37102.93
var telegram_chat_id = -1//process.env.TELEGRAM_TEST_CHAT_ID

before(() => {
    UserModel.create({ telegram_chat_id: telegram_chat_id, settings: { subscriptions: { paid: Date.now() } }, eula: true })
        .catch(err => { console.log(err) })
})

describe.only("Ethereum Blockchain API", () => {

    it('Update the subscription days correctly', async () => {
        await paymentCtrl.addSubscriptionDays(ittTokenSent, telegram_chat_id)
        var updatedUser = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        expect(updatedUser.settings.subscriptions.paid).to.be.greaterThan(new Date())
    })

    it('Throws exception on wrong receiver address', () => {
        var fakeAddress = '0000000000000000000000000000000000000000000000000000000000000000'
        try {
            paymentCtrl.checkReceivingAddress(process.env.TELEGRAM_TEST_CHAT_ID, fakeAddress)
        } catch (err) {
            expect(err.message).to.be.equal('The receiver address 0x0000000000000000000000000000000000000000 of this transaction does not match your ITT wallet receiver address!')
        }
    })

    it('Returns true on matching addresses', () => {
        var txMockAddress = '0000000000000000000000001fD19a3FB5Ec2D73440B908c8038333aeFAd83bC'
        expect(paymentCtrl.checkReceivingAddress(process.env.TELEGRAM_TEST_CHAT_ID, txMockAddress)).to.be.true
    })

    it('txInfoFromRawData => Returns the right txAddress and token amount', () => {
        var rawData = "000000000000000000000000ad02a40a543b396d2c7a598c63a391a7afbf157f0000000000000000000000000d6b5a54f940bf3d52e438cab785981aaefdf40c0000000000000000000000000000000000000000000000000000035fdeb23f40"
        var rawAddress = '0000000000000000000000000d6b5a54f940bf3d52e438cab785981aaefdf40c'
        var parsedInfo = paymentCtrl.txInfoFromRawData(rawData)
        expect(ittTokenSent).to.be.equal(parsedInfo.ittTokens)
        expect(rawAddress).to.be.equal(parsedInfo.receiverAddress)
    })

    it('verifyTx => executes correctly and adds transaction to user', () => {
        assert.fail(null, null, 'Requires a real ITT transaction with a test address')
    })

    it('GET /api/payment/status', () => {

        var paymentApiSpy = sinon.spy(paymentCtrl, 'getUserStatus')

        return chai.request(app)
            .get('/api/payment/status/' + telegram_chat_id)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(res.body.subscriptionDaysLeft).to.be.equal(Math.round(ittTokenSent))
                assert.isTrue(paymentApiSpy.getCall(0).args[0] == telegram_chat_id)
                paymentApiSpy.restore()
            })
    })
})

after(() => {
    return UserModel.remove({ telegram_chat_id: telegram_chat_id })
        .catch(err => console.log(err))
})