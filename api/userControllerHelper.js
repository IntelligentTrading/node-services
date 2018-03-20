var User = require('../models/User');

module.exports = {
    getUsers: (settingsFilters) => {
        var filters_key = settingsFilters ? Object.keys(settingsFilters) : [];
        var query = {};

        filters_key.forEach((key) => {
            var or_conditions = settingsFilters[key].split(',');
            if (or_conditions.length <= 1) {
                query['settings.' + key] = settingsFilters[key];
            } else {
                var or_query_array = [];
                or_conditions.forEach(or_condition => {
                    var or_query = {};
                    or_query['settings.' + key] = or_condition;
                    or_query_array.push(or_query);
                })
                query['$or'] = or_query_array;
            }
        });

        return User.find(query)
    },
    updateUserSettings: (chat_id, settings) => {

        return User.findOne({ telegram_chat_id: parseInt(chat_id) }).then(user => {
            if (settings && user) {

                var settingsToUpdate = Object.keys(settings);
                settingsToUpdate.forEach(settingToUpdate => {
                    user.settings[settingToUpdate] = settings[settingToUpdate];
                })
                user.save()
                return user
            }
        })
    }
}