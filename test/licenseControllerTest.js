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

before(() => {
    UserModel.create({ telegram_chat_id: dummyChatId, settings: { horizon: 'short' }, eula: false })
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

        UserModel.findOneAndUpdate({ telegram_chat_id: dummyChatId }, { eula: true }, { new: true })
            .then(eulaOkUser => {
                return chai.request(app)
                    .post('/api/license/subscribe')
                    .send({ licenseCode: license.code, telegram_chat_id: dummyChatId })
                    .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
                    .then((response) => {
                        expect(response).to.have.status(200)
                        expect(response.body.success).to.be.true
                    })
            })
    })

    it('ITT Team member can authenticate with power token', () => {

        var sampleToken = process.env.TEAM_EMOJIS.split(',')[0]

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: sampleToken, telegram_chat_id: dummyChatId })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
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
    UserModel.findOneAndRemove({ telegram_chat_id: dummyChatId })
        .then(() => colors.gray(console.log('Database cleanup')))
        .catch(err => console.log(err))

    LicenseModel.findOneAndRemove({ code: license.code })
        .catch(err => console.log(err))
})