var solve = (promise, response) => {
    return promise
        .then(result => {
            var status = result.code ? result.code : 200
            var resBody = result.object ? result.object : result
            return response.status(status).send(resBody)
        })
        .catch(err => {
            console.log(err)
            var code = err.code ? err.code : 500
            return response.status(code).send(err.message)
        })
}

module.exports = solve