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

var sampleTx = '0x07f3879c01ca1610c66af28a7f4c44d9636b2913869f89a184a3223356a54a20'
var telegram_chat_id = process.env.TELEGRAM_TEST_CHAT_ID

describe("Ethereum Blockchain API", () => {
    it('Transaction watch returns when Tx is mined', () => {
        return paymentController.watch(sampleTx)
            .then(tx => {
                expect(tx).to.be.not.null
                expect(tx.blockNumber).to.be.not.null
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
            })
    })

    it('POST /payment/verify returns error when Tx is verified > 1', () => {

        return chai.request(app)
            .post('/api/payment/verify')
            .send({ telegram_chat_id: telegram_chat_id, txHash: sampleTx })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                console.log(res)
                return expect(res.statusCode).to.be.equal(200)
            })
    })
})
