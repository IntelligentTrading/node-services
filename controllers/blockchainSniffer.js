var Web3 = require('web3')
var providerEndpoint = process.env.ETH_TEST ? 'ropsten' : 'mainnet'
web3 = new Web3(new Web3.providers.HttpProvider(`https://${providerEndpoint}.infura.io/${process.env.INFURA_TOKEN}`))

const abi = require('../util/abi')
const _ = require('lodash')

var itfEmitter = require('../util/blockchainNotifier').emitter
var itfEvents = require('../util/blockchainNotifier').itfEvents
var Transaction = require('../models/Transaction')
var contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS)

var lastBlockNumber = 0
var blockchainEventEmitter = (startingBlockNumber) => {

    contract.getPastEvents('Transfer', {
        fromBlock: Math.max(startingBlockNumber, lastBlockNumber) + 1,
        toBlock: 'latest'
    }, function (error, events) {
        if (error)
            console.log(error)
        else {
            var sortedEvents = _.sortBy(events, 'blockNumber')

            if (sortedEvents.length > 0) {
                var lastEvent = _.last(sortedEvents)
                lastBlockNumber = Math.max(lastEvent.blockNumber, lastBlockNumber)
                sortedEvents.map(eventObj => {
                    itfEmitter.emit(itfEvents.itfTransfer, eventObj)
                })

                Transaction.remove({}, (err) => {
                    Transaction.create({ blockNumber: lastBlockNumber, hash: lastEvent.transactionHash })
                        .then(() => console.log(`Last block updated to ${lastBlockNumber}`))
                })
            }
        }
    })
}

module.exports.init = async () => {
    var lastTransaction = await Transaction.findOne()
    var startingBlockNumber = lastTransaction ? lastTransaction.blockNumber : 0
    console.log(`Listening on ${providerEndpoint} from block  ${startingBlockNumber}`)
    setInterval(() => blockchainEventEmitter(startingBlockNumber), 10000)
}