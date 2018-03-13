var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index.js')
var _ = require('lodash')
var data = require('./data')
var UserModel = require('../models/User')
var userControllerHelper = require('../api/userControllerHelper')
var colors = require('colors')

var telegram_chat_id = process.env.TELEGRAM_TEST_CHAT_ID

describe('Users Controller Helper', () => {
    it('should get all the users', () => {

        userControllerHelper.getUsers().then(users => {
            UserModel.find().then(dbusers => {
                expect(users).to.be.eql(dbusers)
            })
        })
    })

    it('should get all the users with short horizon', () => {

        userControllerHelper.getUsers({ horizon: 'short' }).then(users => {
            console.log(colors.blue(`  (Found ${users.length} users)`))
            UserModel.find({ 'settings.horizon': 'short' }).then(dbusers => {
                expect(users.length).to.be.equal(dbusers.length)
            })
        })
    })

    it('should have the new settings for the user', () => {

        userControllerHelper.updateUserSettings(telegram_chat_id, { horizon: 'long' })
            .then((updatedUser) => {
                expect(updatedUser.settings.horizon).to.be.equal('long')
            })
            .catch(err => { console.log(err) })
    })
})