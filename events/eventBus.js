var fs = require('fs')
const EventEmitter = require('events')
const emitter = new EventEmitter()

var behaviors = fs.readdirSync('./events/behaviors')
behaviors.forEach(b => {
    var behavior = b.replace('.js', '')
    var behaviorModule = require(`./behaviors/${behavior}`)

    emitter.on(behavior, (args) => {
        behaviorModule.do(args)
    })
})

module.exports = emitter