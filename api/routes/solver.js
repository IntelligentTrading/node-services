var solve = (promise, response) => {
    promise
        .then(result => {
            var status = result.code ? result.code : 200
            var resBody = result.object ? result.object : result
            response.status(status).send(resBody)
        })
        .catch(err => {
            console.log(err)
            var code = err.code ? err.code : 500
            response.status(code).send(err.message)
        })
}

module.exports = solve