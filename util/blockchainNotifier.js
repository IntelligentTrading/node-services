const EventEmitter = require('events')
const emitter = new EventEmitter()

var itfEvents = {
    itfTransfer: 'itfTransfer',
    itfBurn: 'itfBurn'
}

module.exports.emitter = emitter
module.exports.itfEvents = itfEvents

//! This is a way to share event emitter and trigger events from any part of the application. 
//! We could use the process event emitter but it will become complicated to scale