var stakingCtrl = require('./controllers/stakingController')
var database = require('./database')
database.connect()

var run = () => {
    return stakingCtrl.refreshStakingStatus()
        .catch((err) => console.log(err))
}

run().then(() => {
    console.log('Stake holders check completed.')
    // This timeout avoids to exit before mongoose closes persists the model. 
    // It might be a bug of the driver.
    setTimeout(() => process.exit(0), 10000)
})
