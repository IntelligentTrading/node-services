var mongoose = require('mongoose')

module.exports.connect = () => {
    var options = {
        useMongoClient: true,
        keepAlive: 300,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500 // Reconnect every 500ms
    }

    mongoose.connect(process.env.MONGODB_URI, options);
    mongoose.Promise = global.Promise;

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log('Database connected');
    })
}