var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiHttp = require('chai-http')
var app = require('../index')
var colors = require('colors')
var sinon = require('sinon')
var feedbackCtrl = require('../controllers/feedbackController')

chai.use(chaiHttp)


var Trello = require('trello');
var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
var ITT_BOARD_ID = process.env.ITT_TRELLO_BOARD_ID;
var testCards = [];

describe('Feedback Library', () => {

    it('Add feedback returns a card with a specific template', () => {
        var chat_id = -1
        var user = 'test'
        var content = 'Any content'

        return feedbackCtrl.addFeedback(user, chat_id, content)
            .then(card => {
                expect(card.desc).to.be.equal(`[Chat #${chat_id}]\n${content}`)
                expect(card.name).to.be.equal(`Feedback from ${user}`)
                testCards.push(card)
            })
    })

    it('POST /api/feedback adds feedback and return 200 + a card with a specific template', () => {

        var feedback = {
            telegram_chat_id: -1,
            user: 'test',
            content: 'Any posted content'
        }

        return chai.request(app)
            .post('/api/feedback')
            .send(feedback)
            .set('NSVC-API-KEY', process.env.NODE_SVC_API_KEY)
            .then(res => {
                var card = res.body;
                expect(card.desc).to.be.equal(`[Chat #${feedback.telegram_chat_id}]\n${feedback.content}`)
                expect(card.name).to.be.equal(`Feedback from ${feedback.user}`)
                testCards.push(card)
            })
    })
})

after(() => {
    return testCards.map(card => {
        return trello.deleteCard(card.id)
            .catch(err => console.log(err))
    })
})
