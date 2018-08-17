var asana = require('asana')
var personalAccessToken = process.env.ASANA_TOKEN
var projectId = 710996572287963
var sectionId = 710996572287964

// Construct an Asana client
var client = asana.Client.create().useAccessToken(personalAccessToken);

function asanaTask(user, chat_id, content) {

    var task = {
        "projects": `${projectId}`,
        "memberships": [
            {
                "project": `${projectId}`,
                "section": `${sectionId}`

            }],
        "name": `From ${user} / ${chat_id}`,
        "notes": `${content}`
    }

    return client.tasks.create(task).then(result => {
        return result
    }).catch(err => console.log(err))
}

module.exports.asana = asanaTask