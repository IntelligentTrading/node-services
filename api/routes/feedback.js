var express = require('express')
var router = express.Router()
var feedbackCtrl = require('../../controllers/feedbackController')
var solve = require('../../util/solver')

router.post('/', (req, res) => {
    var user = req.body.user
    var content = req.body.content
    var chat_id = req.body.telegram_chat_id
    solve(feedbackCtrl.asana(user,chat_id,content), res)
})

module.exports = router