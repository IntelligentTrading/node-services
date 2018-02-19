var feedbackApi = require('../api/feedback').feedback;

module.exports = {
    addFeedback: (req, res) => {

        feedbackApi.addFeedback(req.body)
            .then((card_result) => {
                return res.send(card_result)
            })
            .catch((reason) => {
                console.log(reason.message);
                return res.status(500).send(reason.message);
            });
    }
}