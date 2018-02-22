var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var data = require('./data')
var UserModel = require('../api/models/User')
var LicenseModel = require('../api/models/License')

chai.use(chaiHttp)

describe('License Controller', () => {

    var subscriptionPlan = 'beta'
    var license = undefined;
    var newUser = data.userTemplate()

    UserModel.findOneAndRemove({ telegram_chat_id: newUser.telegram_chat_id })
        .catch(err => console.log(err))


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
            .post('/api/users/')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(newUser)
            .then(() => {
                return chai.request(app)
                    .post('/api/license/subscribe')
                    .send({ licenseCode: license.code, telegram_chat_id: newUser.telegram_chat_id })
                    .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
                    .then((response) => {
                        expect(response).to.have.status(200)
                        expect(response.body.success).to.be.true
                    })
            })
    })

    it('POST /license/subscribe returns 200 and success=false if already redeemed', () => {
        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: license.code, telegram_chat_id: newUser.telegram_chat_id })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((response) => {
                expect(response).to.have.status(200)
                expect(response.body.success).to.be.false
            })
    })

    it('User token is the token generated now', () => {
        LicenseModel.findOneAndRemove({ code: license.code })
            .catch(err => console.log(err))

        return UserModel.findOne({ telegram_chat_id: -1 })
            .then(subscriber => {
                assert.equal(subscriber.token, license.code)
            })
    })

    it('ITT Team member can authenticate with power token', () => {

        var sampleToken = process.env.TEAM_EMOJIS.split(',')[0]

        return chai.request(app)
            .post('/api/license/subscribe')
            .send({ licenseCode: sampleToken, telegram_chat_id: newUser.telegram_chat_id })
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
            .send({ licenseCode: 'ErrorToken', telegram_chat_id: newUser.telegram_chat_id })
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((err) => {
                expect(err).to.have.status(500)
            })
    })
})
