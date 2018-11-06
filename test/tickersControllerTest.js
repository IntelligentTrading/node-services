var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var tickersCtrl = require('../controllers/tickersController')

chai.use(chaiHttp)

describe('Tickers Controller', () => {

    it('GET /ticker Returns 500 if symbol is undefined or empty', () => {

        return chai.request(app)
            .get('/api/tickers/transaction_currencies')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((err) => {
                expect(err).to.have.status(500)
            })
    })

    it('GET /ticker Returns 200 if symbol is defined', () => {

        return chai.request(app)
            .get('/api/tickers/transaction_currencies/ETH')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then((res) => {
                expect(res).to.have.status(200)
                expect(res.body).to.be.not.empty
            })
    })

    it('GET /ticker Returns 500 if symbol is defined but not found', () => {

        return chai.request(app)
            .get('/api/tickers/transaction_currencies/XXX')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .catch((res) => {
                expect(res).to.have.status(500)
            })
    })
})
