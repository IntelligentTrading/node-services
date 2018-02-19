var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var marketApi = require('../api/market').api;
var _ = require('lodash')

chai.use(chaiHttp)
let server;

before((done) => {
    app.on("appStarted", done)
});

describe('List of counter currencies', () => {
    it('Should never be null', () => {
        var counterCurrencies = marketApi.counterCurrencies();
        assert.notEqual(counterCurrencies, null, 'It is not null');
    })

    it('Should have 4 elements', () => {
        var counterCurrencies = marketApi.counterCurrencies();
        assert.equal(counterCurrencies.length, 4, 'It has 4 elements');
    })
})

describe('Market API', () => {
    it('Ticker fails if symbol is null', () => {
        return marketApi.ticker().catch(err => { return expect(err.message).to.be.equal('Ticker symbol cannot be null') })
    })

    it('Ticker fails if symbol is not in the list', () => {
        return marketApi.ticker('XXX').catch(err => {
            return expect(err.message).to.be.equal('XXX Tickers Info not found')
        })
    })

    it('Ticker returns a result if symbol is in the list', () => {
        return marketApi.ticker('ETH').then(ethereum => {
            expect(ethereum.name).to.be.equal('Ethereum')
            expect(ethereum.symbol).to.be.equal('ETH')
            expect(ethereum.symbol).to.not.be.equal('BTC')
        });
    })


})

describe('GET Tickers', () => {
    it('Should be unauthorized without header', () => {

        return chai.request(app)
            .get('/api/tickers')
            .catch(err => {
                expect(err).to.have.status(401)
            })
    })

    it('Should have status 200 with header', () => {

        return chai.request(app)
            .get('/api/tickers')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(res).to.have.status(200)
            })
    })

    it('Should have length > 0', () => {

        return chai.request(app)
            .get('/api/tickers')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(res.body).to.have.length.above(0, `Length of tickers > 0 (${res.body.length})`)
            })
    })

    it('REST and function call have the same result', () => {

        return marketApi.tickers().then(tickers => {

            return chai.request(app)
                .get('/api/tickers')
                .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
                .then(res => {
                    var restTickers = res.body;
                    assert.isTrue(_.isEqual(restTickers, tickers))
                    expect(restTickers.length).to.be.not.equal(tickers.slice(2).length)
                })
        })
    })
})