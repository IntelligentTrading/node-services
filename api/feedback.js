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
                var cardName = `User ${feedback.chat_id}, feedback `;

                /*
                    ? Is there a better way to get the ticket code?
                    ? are we using another service?
                */
                return trello.addCard(cardName, `${feedback.content}`, issueList.id)
                    .then(card => {
                        trello.updateCardName(card.id,cardName + card.shortLink)
                            .then(() => { return card })
                            .catch(reason => { return reason });
                    })
                    .catch(reason => {
                        return reason
                    });
            })
            .catch(reason => {
                console.log(reason);
                return reason
            });
    }
}

exports.feedback = feedback;