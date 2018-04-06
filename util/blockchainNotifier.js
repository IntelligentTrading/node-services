const EventEmitter = require('events')
const emitter = new EventEmitter()

module.exports = emitter

//! This is a way to share event emitter and trigger events from any part of the application. 
//! We could use the process event emitter but it will become complicated to scale