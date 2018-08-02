var Web3 = require('web3')
require('request-promise')
var providerEndpoint = process.env.ETH_TEST ? 'ropsten' : 'mainnet'
var web3 = new Web3(new Web3.providers.HttpProvider(`https://${providerEndpoint}.infura.io/${process.env.INFURA_TOKEN}`))
const abi = require('./util/abi')
var contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS)

contract.methods.balanceOf('0x1fd19a3fb5ec2d73440b908c8038333aefad83bc').call().then(tknBalance => {
    console.log(web3.utils.fromWei(tknBalance))
})
