var cache = require('../../cache').redis

module.exports.do = (user) => {
    refreshUserCache(user)
    //userController.updateUser(user.telegram_chat_id, user.settings)
}

function refreshUserCache(user) {
    //console.log('Refreshing cache for ' + user.telegram_chat_id)
    cache.set(`tci_${user.telegram_chat_id}`, JSON.stringify(user))
}
