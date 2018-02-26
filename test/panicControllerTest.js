var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index')
var CryptoFeed = require('../models/CryptoFeed')
var data = require('./data')
var colors = require('colors')

chai.use(chaiHttp)


var feed = data.cryptoFeed()

describe('Panic Controller', () => {
    it('POST /api/panic Returns the added feed', () => {

        return chai.request(app)
            .post('/api/panic')
            .send(feed)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                console.log(colors.cyan(`\tChecking if ${feed.feedId} == ${res.body.feedId}`))
                expect(feed.feedId).to.be.equal(res.body.feedId)
            })
    })

    it('PUT /api/panic Returns the updated feed', () => {

        feed = data.cryptoFeedUpdate()

        return chai.request(app)
            .put('/api/panic')
            .send(feed)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(feed.feedId).to.be.equal(res.body.feedId)
                expect(feed.ittBearish).to.be.deep.equal(res.body.ittBearish)
                expect(feed.ittBullish).to.be.deep.equal(res.body.ittBullish)
                expect(feed.ittImportant).to.be.deep.equal(res.body.ittImportant)
            })
    })

    it('PUT /api/panic on a second run returns the updated feed with 2 ittvotes for this instance (as if 2 users voted)', () => {

        feed = data.cryptoFeedUpdate()

        return chai.request(app)
            .put('/api/panic')
            .send(feed)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                expect(feed.feedId).to.be.equal(res.body.feedId)
                expect(res.body.ittBearish.length).to.be.equal(2)
                expect(res.body.ittBullish.length).to.be.equal(2)
                expect(res.body.ittImportant.length).to.be.equal(2)
            })
    })

    CryptoFeed.findOneAndRemove({ feedId: feed.feedId })
        .catch(err => console.log(err))
})