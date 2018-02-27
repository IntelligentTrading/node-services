var Trello = require('trello');
var trello = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
var ITT_BOARD_ID = process.env.ITT_TRELLO_BOARD_ID;

module.exports = {
    addFeedback: (user, chat_id, content) => {
        return trello.getListsOnBoard(ITT_BOARD_ID)
            .then((lists) => {
                var issuesListResults = lists.filter(list => list.name == process.env.ITT_TRELLO_LIST);

                if (issuesListResults == undefined || issuesListResults.length <= 0)
                    throw new Error('List not found');

                return issuesListResults[0];
            }).then(issueList => {
                var cardName = `Feedback from ${user}`;

                return trello.addCard(cardName, `[Chat #${chat_id}]\n${content}`, issueList.id)
                    .then(card => {
                        return trello.updateCardName(card.id, `[${card.shortLink}] ${cardName}`)
                            .then(() => { return card; })
                    })
            })
    }
}