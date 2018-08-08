var stakingCtrl = require('./controllers/stakingController')
var database = require('./database')
database.connect()

var run = () => {
    stakingCtrl.refreshStakingStatus()
        .then(() => console.log('Stake holders check completed.'))
        .catch((err) => console.log(err))
        .then(() => process.exit())
}

run()
