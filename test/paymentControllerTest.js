var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var colors = require('colors')
var sinon = require('sinon')
var paymentController = require('../controllers/paymentController')
var UserModel = require('../models/User')

chai.use(chaiHttp)

var sampleTx = '0x97e52d6a21e94566b1174e5adb0b853a3fde7434031a99cdae10eff2300d33c8'
var ittTokenSent = 37102.93
var telegram_chat_id = -1//process.env.TELEGRAM_TEST_CHAT_ID

before(() => {
    UserModel.create({ telegram_chat_id: telegram_chat_id, settings: { subscriptions: { paid: Date.now() } }, eula: true })
        .catch(err => { console.log(err) })
})

describe("Ethereum Blockchain API", () => {
    it('Transaction watch returns when Tx is mined', () => {
        return paymentController.watch(sampleTx)
            .then(tx => {
                expect(tx).to.be.not.null
                expect(tx.blockNumber).to.be.not.null
            })
    })

    it('Update the subscription days correctly', async () => {
        await paymentController.addSubscriptionDays(ittTokenSent, telegram_chat_id)
        var updatedUser = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        expect(updatedUser.settings.subscriptions.paid).to.be.greaterThan(new Date())
    })

    it('GET /api/payment/status', () => {

        var paymentApiSpy = sinon.spy(paymentController, 'getUserStatus')

        return chai.request(app)
            .get('/api/payment/status/' + telegram_chat_id)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(res.body.subscriptionDaysLeft).to.be.equal(Math.round(ittTokenSent))
                assert.isTrue(paymentApiSpy.getCall(0).args[0] == telegram_chat_id)
                paymentApiSpy.restore()
            })
    })

    it('Transaction receipt log data conversion to ITT token sent', () => {
        return paymentController.receipt(sampleTx).then(receipt => {
            receipt.logs.map(log => {
                return expect(paymentController.ToIttTokens(log.data)).to.be.equal(ittTokenSent)
            })
        })
    })

    it('POST /payment/verify returns when Tx is mined', () => {

        var paymentApiSpy = sinon.spy(paymentController, 'addSubscriptionDays')

        return chai.request(app)
            .post('/api/payment/verify')
            .send({ telegram_chat_id: telegram_chat_id, txHash: sampleTx })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(res.body.hash).to.be.equal(sampleTx)
                expect(res.body.blockNumber).to.be.not.null
                expect(paymentApiSpy.getCall(0).args[1]).to.be.equal(telegram_chat_id)
                paymentApiSpy.restore()
            })
    })
})

after(() => {
    return UserModel.remove({ telegram_chat_id: telegram_chat_id })
        .catch(err => console.log(err))
})