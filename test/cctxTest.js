var chai = require('chai');
var assert = chai.assert;
var cctxApi = require('../api/ccxt-api').api;

describe('List of counter currencies', () => {
    it('Should never be null', () => {
        var counterCurrencies = cctxApi.counterCurrencies();
        assert.notEqual(counterCurrencies, null, 'It is not null');
    })

    it('Should have 4 elements', () => {
        var counterCurrencies = cctxApi.counterCurrencies();
        assert.equal(counterCurrencies.length, 4, 'It has 4 elements');
    })
})