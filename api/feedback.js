var Trello = require('trello');
var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
var ITT_BOARD_ID = process.env.ITT_TRELLO_BOARD_ID;

var feedback = {
    addFeedback: (feedback) => {
        return trello.getListsOnBoard(ITT_BOARD_ID)
            .then((lists) => {
                var issuesListResults = lists.filter(list => list.name == process.env.ITT_TRELLO_LIST);

                if (issuesListResults == undefined || issuesListResults.length <= 0)
                    throw new Error('List not found');

                return issuesListResults[0];
            }).then(issueList => {

                console.log(feedback);
                return trello.addCard(`Feedback @ ${feedback.chat_id}`, `${feedback.content}`, issueList.id)
                    .then(card => {
                        return card;
                    })
                    .catch(reason => {
                        return reason
                    });
            })
            .catch(reason => {
                return reason
            });
    }
}

exports.feedback = feedback;