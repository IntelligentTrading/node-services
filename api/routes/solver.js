var solve = (promise, response) => {
    return promise
        .then(result => {
            var status = result.statusCode ? result.statusCode : 200
            var resBody = result.object ? result.object : result
            return response.status(status).send(resBody)
        })
        .catch(err => {
            if (process.env.NODE_ENV !== 'test')
                console.log(err)

            var statusCode = err.statusCode ? err.statusCode : 500
            return response.status(statusCode).send(err.message)
        })
}

module.exports = solve