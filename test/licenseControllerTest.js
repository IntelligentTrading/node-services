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

var dummyChatId = -999
var newUser = undefined
var license = undefined
var sampleToken = process.env.TEAM_EMOJIS.split(',')[0]

before(() => {
    UserModel.create({ telegram_chat_id: dummyChatId, settings: { horizon: 'short' }, eula: true })
        .then(user => {
            newUser = user
            console.log(colors.blue('  Test user added'))
        })
        .catch(err => { console.log(err) })
});

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
            .send({ licenseCode: license.code, telegram_chat_id: dummyChatId })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
                expect(response).to.have.status(200)
                expect(response.body.success).to.be.true
            })
    })

    it('ITT Team member can authenticate with power token', () => {

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: sampleToken, telegram_chat_id: dummyChatId })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
                console.log(response)
                expect(response).to.have.status(200)
                expect(response.body.success).to.be.true
                expect(response.body.user.settings.subscription_plan).to.be.equal(100)
                expect(response.body.user.token).to.be.equal(sampleToken)
            })
    })

    it('Error 500 on invalid token', () => {

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: 'ErrorToken', telegram_chat_id: dummyChatId })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((err) => {
                expect(err).to.have.status(500)
            })
    })
})

after(() => {
    UserModel.remove({ telegram_chat_id: dummyChatId })
        .then(() => colors.gray(console.log(' Test user removed')))
        .catch(err => console.log(err))

    LicenseModel.remove({ code: license.code })
        .then(() => colors.gray(console.log('Test license cleaned')))
        .catch(err => console.log(err))

    LicenseModel.update({ code: sampleToken }, { redeemed: false })
        .then(() => colors.gray(console.log('Test power token reset')))
        .catch(err => console.log(err))
})