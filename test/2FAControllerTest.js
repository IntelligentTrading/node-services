var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var colors = require('colors')
var sinon = require('sinon')
var twoFAController = require('../controllers/2FAController')
var UserModel = require('../models/User')

chai.use(chaiHttp)

var telegram_chat_id = process.env.TELEGRAM_TEST_CHAT_ID

describe.only("2FA API", () => {
    it('Generates a secret for chat_id', async () => {
        var secret = await twoFAController.generateSecretFor(telegram_chat_id)
        var user = await UserModel.findOne({ telegram_chat_id: telegram_chat_id })
        expect(secret.base32).to.be.equal(user.settings.TwoFASecret.secret32)
    })

    it('Verifies a token for chat_id (wrong)', async () => {
        var wrongToken = 12345
        var result = await twoFAController.verify(telegram_chat_id, wrongToken)
        expect(result).to.be.false
    })

    it('Verifies a token for chat_id (correct)', async () => {
        var correctToken = await twoFAController.getToken(telegram_chat_id)
        var result = await twoFAController.verify(telegram_chat_id, correctToken)
        expect(result).to.be.true
    })

    it('GET Returns the current token for chat_id', async () => {

        var correctToken = await twoFAController.getToken(telegram_chat_id)

        return chai.request(app)
            .get(`/api/otp/token/${telegram_chat_id}`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(correctToken).to.be.equal(res.text)
                expect(0000).to.be.not.equal(res.text)
            })
    })

    it('GET Returns the result for token verification for chat_id', async () => {

        var correctToken = await twoFAController.getToken(telegram_chat_id)

        return chai.request(app)
            .get(`/api/otp/verify/?telegram_chat_id=${telegram_chat_id}&token=${correctToken}`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(result => {
                expect(result.body).to.be.true
            })
    })
})