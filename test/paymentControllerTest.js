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
var testData = require('./data')

chai.use(chaiHttp)

var testTx = testData.etherTx()
var telegram_chat_id = -1//process.env.TELEGRAM_TEST_CHAT_ID

before(() => {
    UserModel.create({ telegram_chat_id: telegram_chat_id, settings: { subscriptions: { paid: Date.now() } }, eula: true })
        .catch(err => { console.log(err) })
})

describe("Ethereum Blockchain API", () => {

    it('GET /api/payment/status', () => {

        var paymentApiSpy = sinon.spy(paymentCtrl, 'getUserStatus')

        return chai.request(app)
            .get('/api/payment/status/' + telegram_chat_id)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(parseInt(res.body.subscriptionDaysLeft)).to.be.equal(0)
                assert.isTrue(paymentApiSpy.getCall(0).args[0] == telegram_chat_id)
                paymentApiSpy.restore()
            })
    })
})

after(() => {
    return UserModel.remove({ telegram_chat_id: telegram_chat_id })
        .catch(err => console.log(err))
})