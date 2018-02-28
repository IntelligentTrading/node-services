var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var data = require('./data')
var sinon = require('sinon')
var colors = require('colors')

var eulaController = require('../controllers/eulaController')
var UserModel = require('../models/User')

chai.use(chaiHttp)

var testUserChatId = process.env.TELEGRAM_TEST_CHAT_ID

describe('EULA Controller', () => {

    var spy = sinon.spy(app, 'render')

    it('/eula returns 500 without chat_id as parameter', () => {

        return chai.request(app)
            .get('/eula?u=')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((res) => {
                expect(res).to.have.status(500)
            })
    })

    it('/eula should exist if we pass a telegram chat id as query parameter u', () => {
        return chai.request(app)
            .get('/eula?u=' + testUserChatId)
            .then(res => {
                expect(res).to.have.status(200)
            })
    })

    it('/eula should render the "EULA" view', () => {
        return expect(spy.getCall(0).args[0]).to.be.eql('eula');
    })

    it('/eula_confirm returns 500 without chat_id as parameter', () => {

        return chai.request(app)
            .get('/eula_confirm?u=')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((res) => {
                expect(res).to.have.status(500)
            })
    })

    it('/eula_confirm should exist if we pass a telegram chat id as query parameter u', () => {
        return chai.request(app)
            .get('/eula_confirm?u=' + testUserChatId)
            .then(res => {
                expect(res).to.have.status(200)
            })
            .catch(err => console.log(err))
    })

    it('/eula_confirm should render the "EULA done" view', () => {
        return expect(spy.getCall(1).args[0]).to.be.eql('eula_done');
    })

    it('/eula_confirm should add the new User to the DB', () => {

        UserModel.findOne({ telegram_chat_id: testUserChatId })
            .then(user => {
                expect(user).to.be.not.null
                expect(user).to.be.not.undefined
                expect(user.eula).to.be.true
            })
    })

    it('EULA Test Database cleanup', () => {
        UserModel.findOneAndRemove({ telegram_chat_id: testUserChatId })
            .then(() => colors.gray(console.log('Database cleanup')))
            .catch(err => console.log(err))
    })
})