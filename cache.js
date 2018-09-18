var Bluebird = require("bluebird")
var redis = require('redis');
Bluebird.promisifyAll(redis.RedisClient.prototype);
var redisClient = redis.createClient()


redisClient.on('connect', function () {
    console.log('Redis client connected');
});

redisClient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

module.exports = {
    redis: redisClient
}