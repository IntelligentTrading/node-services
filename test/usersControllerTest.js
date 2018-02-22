var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var dbapi = require('../api/db').database
var data = require('./data')

chai.use(chaiHttp)

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

        var id = 999;
        return chai.request(app)
            .get('/api/users/' + id)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.telegram_chat_id).to.be.equal(id)
            })
            .catch(err => {
                expect(err).to.have.status(404)
            })
    })

    it('POST /users returns 201 and new user when successful, 500 and Duplicate Chat Id if fails', () => {
        var newUser = data.userTemplate()

        return chai.request(app)
            .post('/api/users/')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(newUser)
            .then(res => {
                return expect(res).to.have.status(201)
            })
            .catch(err => {
                expect(err).to.have.status(500)
                expect(err.response.text).to.be.equal('Duplicate Chat Id')
            })
    })

    it('PUT /users returns 200 and removed currency when successfully unfollowing it', () => {

        var update = {
            "settings": {
                "counter_currencies": [{
                    "index": 1,
                    "follow": "False"
                }]
            }
        }

        return chai.request(app)
            .put('/api/users/999/currencies/counter')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(update)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.settings.counter_currencies).to.not.contain(1)
            })
    })

    it('PUT /users returns 200 and new currency when successfully following it', () => {

        var update = {
            "settings": {
                "counter_currencies": [{
                    "index": 1,
                    "follow": "True"
                }]
            }
        }

        return chai.request(app)
            .put('/api/users/999/currencies/counter')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .send(update)
            .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.settings.counter_currencies).to.contain(1)
            })
    })
})
