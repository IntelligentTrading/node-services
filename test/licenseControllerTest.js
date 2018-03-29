var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var colors = require('colors')
var data = require('./data')
var UserModel = require('../models/User')
var LicenseModel = require('../models/License')

chai.use(chaiHttp)

var newUser = undefined
var license = undefined
var sampleToken = process.env.TEAM_EMOJIS.split(',')[0]
var telegram_chat_id = process.env.TELEGRAM_TEST_CHAT_ID

describe('License Controller', () => {

    var subscriptionPlan = 'beta'

    it('POST /license/generate/:subscriptionPlan returns 201 and a valid token if subscriptionPlan is defined', () => {

        return chai.request(app)
            .post('/api/license/generate/' + subscriptionPlan)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
                expect(response).to.have.status(201)
                expect(response).to.be.not.empty
                license = response.body;
            })
    })

    it('POST /license/subscribe returns 200 and a success=true if OK', () => {

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: license.code, telegram_chat_id: telegram_chat_id })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
                expect(response).to.have.status(200)
                expect(response.body.success).to.be.true
            })
    })

    it('ITT Team member can authenticate with power token', () => {

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: sampleToken, telegram_chat_id: telegram_chat_id })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
                expect(response).to.have.status(200)
                expect(response.body.success).to.be.true
                expect(response.body.user.settings.is_ITT_team).to.be.true
                expect(response.body.user.token).to.be.equal(sampleToken)
            })
    })

    it('Error 500 on invalid token', () => {

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: 'ErrorToken', telegram_chat_id: telegram_chat_id })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((err) => {
                expect(err).to.have.status(500)
            })
    })
})

after(() => {

    LicenseModel.remove({ code: license.code })
        .catch(err => console.log(err))

    LicenseModel.update({ code: sampleToken }, { redeemed: false })
        .catch(err => console.log(err))
})