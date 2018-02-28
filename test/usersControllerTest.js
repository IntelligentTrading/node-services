var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var data = require('./data')
var UserModel = require('../models/User')
var marketapi = require('../api/market')
var colors = require('colors')

chai.use(chaiHttp)

var testUserChatId = 999;

describe('Users Controller', () => {
    it('GET /users Returns 200 and an array of users', () => {

        return chai.request(app)
            .get('/api/users')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('array')
            })
    })

    it('GET /users Returns 200 and user if user exists, 404 if user does not exist', () => {


        return chai.request(app)
            .get('/api/users/' + testUserChatId)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.telegram_chat_id).to.be.equal(testUserChatId)
            })
            .catch(err => {
                expect(err).to.have.status(404)
            })
    })

    it('POST /users returns 201 and new user when successful', () => {
        var newUser = data.userTemplate()

        return chai.request(app)
            .post('/api/users/')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(newUser)
            .then(res => {
                return expect(res).to.have.status(201)
            })
    })

    it('POST /users returns 500 and Duplicate Chat Id', () => {
        var newUser = data.userTemplate()

        return chai.request(app)
            .post('/api/users/')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(newUser)
            .catch(err => {
                expect(err).to.have.status(500)
                expect(err.response.text).to.be.equal('Duplicate Chat Id')
            })
    })

    it('PUT /users returns 200 and removed currency when successfully unfollowing it', () => {

        var update = {
            currencies: [{
                "index": 1,
                "follow": "False"
            }]
        }

        return chai.request(app)
            .put(`/api/users/${testUserChatId}/currencies/counter`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(update)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.settings.counter_currencies).to.not.contain(1)
            })
    })

    it('PUT /users returns 200 and new currency when successfully following it', () => {

        var update = {
            currencies: [{
                "index": 1,
                "follow": "True"
            }]
        }

        return chai.request(app)
            .put(`/api/users/${testUserChatId}/currencies/counter`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(update)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.settings.counter_currencies).to.contain(1)
            })
    })

    it('PUT /users/:id/currencies/:currenciesPairRole Returns 404 if currenciesPairRole is not transaction or counter', () => {

        return chai.request(app)
            .put(`/api/users/${testUserChatId}/currencies/invalid`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch(err => {
                expect(err).to.have.status(404)
            })
    })

    it('PUT /users/:id/select_all_signals returns 200 and the user has all the currencies selected', () => {

        return chai.request(app)
            .put(`/api/users/${testUserChatId}/select_all_signals`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.settings.counter_currencies.length).to.be.equal(2)
                marketapi.tickers()
                    .then(tickers => {
                        return expect(res.body.settings.transaction_currencies.length).to.be.equal(tickers.length)
                    })
            })
    })
})

after(() => {
    return UserModel.remove({ telegram_chat_id: testUserChatId })
        .then(user => { console.log(colors.blue('  Test user killed')) })
})
