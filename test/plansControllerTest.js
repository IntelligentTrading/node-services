var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index')
var PlanModel = require('../models/Plan')

chai.use(chaiHttp)


describe('Plans Controller', () => {
    it('GET /api/plans/:signal? Returns list of plans if signal is undefined or empty', () => {

        return chai.request(app)
            .get('/api/plans')
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                return PlanModel.find().then(plans => {
                    plans.forEach(plan => {
                        expect(res.body.filter(item => item.plan == plan.plan)).to.be.not.empty
                    })
                })
            })
    })

    it('GET /api/plans/:signal? Returns one plan if signal is defined', () => {

        var signal = 'RSI'

        return chai.request(app)
            .get('/api/plans/' + signal)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                return PlanModel.findOne({ 'signals': signal })
                    .then(plan => expect(res.body[0].plan).to.be.equal(plan.plan))
            })
    })
})