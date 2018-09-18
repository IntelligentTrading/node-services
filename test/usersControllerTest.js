var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var data = require('./data')
var UserModel = require('../models/User')
var marketapi = require('../api/market')
var userCtrl = require('../controllers/usersController')
var colors = require('colors')

chai.use(chaiHttp)

var telegram_chat_id = parseInt(process.env.TELEGRAM_TEST_CHAT_ID)

describe('Users Controller', () => {

    it('Should get all the users', () => {

        return userCtrl.all().then(users => {
            return UserModel.find().then(dbusers => {
                return expect(users).to.be.eql(dbusers)
            })
        })
    })

    it('Should get all the users with short horizon', async () => {

        var usersFromCtrl = await userCtrl.getUsers({ horizon: 'short' })
        var dbUsers = await UserModel.find({ 'settings.horizon': 'short' })

        return expect(usersFromCtrl.length).to.be.equal(dbUsers.length)
    })

    it('Should have the new settings for the user', () => {

        return userCtrl.updateUser(telegram_chat_id, { horizon: 'long' })
            .then((updatedUser) => {
                return expect(updatedUser.settings.horizon).to.be.equal('long')
            })
    })

    it('Throws exception if the chat_id is null (of course)', () => {

        return userCtrl.updateUser(null, { horizon: 'long' })
            .catch((err) => {
                return expect(err).to.be.not.null
            })
    })

    it('GET /api/users Returns 200 and an array of users', () => {

        return chai.request(app)
            .get('/api/users')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('array')
            })
    })

    it('GET /users/telegram_chat_id Returns 200 and user if user exists', () => {

        return chai.request(app)
            .get('/api/users/' + telegram_chat_id)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                return expect(res).to.have.status(200)
                //expect(res.body.telegram_chat_id).to.be.equal(telegram_chat_id)
            })
    })

    it('GET /users/telegram_chat_id Returns 404 if user does not exist', () => {

        return chai.request(app)
            .get('/api/users/0000000')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch(err => {
                return expect(err).to.have.status(404)
            })
    })

    it('POST /api/users returns 201 and new user when successful', () => {
        var newUser = data.userTemplate()

        return chai.request(app)
            .post('/api/users/')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(newUser)
            .then(res => {
                return expect(res).to.have.status(201)
            })
            .catch(err => console.log(err))
    })

    it('POST /users returns 500 and duplicate key', () => {
        var newUser = data.userTemplate()

        return chai.request(app)
            .post('/api/users/')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(newUser)
            .catch(err => {
                expect(err).to.have.status(500)
                expect(err.response.text).to.contain('duplicate key')
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
            .put(`/api/users/${telegram_chat_id}/currencies/counter`)
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
            .put(`/api/users/${telegram_chat_id}/currencies/counter`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(update)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.settings.counter_currencies).to.contain(1)
            })
    })

    it('PUT /users/:id/currencies/:currenciesPairRole Returns 404 if currenciesPairRole is not transaction or counter', () => {

        return chai.request(app)
            .put(`/api/users/${telegram_chat_id}/currencies/invalid`)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch(err => {
                expect(err).to.have.status(404)
            })
    })

    it('PUT /users/:id/select_all_signals returns 200 and the user has all the currencies selected', () => {

        return chai.request(app)
            .put(`/api/users/${telegram_chat_id}/select_all_signals`)
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