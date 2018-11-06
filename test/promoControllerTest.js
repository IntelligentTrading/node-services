var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index')
var data = require('./data')
var colors = require('colors')
var promoController = require('../controllers/promoController')

chai.use(chaiHttp)

describe('Promo Controller', () => {
    it('Fails with the wrong params', () => {

        return expect(promoController.apply()).to.be.rejectedWith('Please provide all the required parameters.');
    })
})