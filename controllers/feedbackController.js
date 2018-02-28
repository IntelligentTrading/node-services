var feedbackApi = require('../api/feedback');

function addFeedback(req, res) {

    var user = req.body.user
    var content = req.body.content
    var chat_id = req.body.telegram_chat_id

    feedbackApi.addFeedback(user, chat_id, content)
        .then((card_result) => {
            return res.send(card_result)
        })
        .catch((reason) => {
            console.log(reason.message);
            return res.status(500).send(reason.message);
        });
}

module.exports.addFeedback = addFeedback