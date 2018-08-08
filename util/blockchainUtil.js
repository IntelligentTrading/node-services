var ethereumjs_util = require('ethereumjs-util')
var Web3 = require('web3')
require('request-promise')
var providerEndpoint = process.env.ETH_TEST ? 'ropsten' : 'mainnet'
var web3 = new Web3(new Web3.providers.HttpProvider(`https://${providerEndpoint}.infura.io/${process.env.INFURA_TOKEN}`))
const abi = require('./abi')
var contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS)

module.exports = {
    isAddress: (addr) => {
        return web3.utils.isAddress(addr)
    },
    verifySignature: (signature, address, msg) => {
        var result = web3.eth.accounts.recover(msg, signature)
        return { signature: signature, address: result, verified: address.toLowerCase() === result.toLowerCase() }
    },
    getBalance: (address) => {
        return contract.methods.balanceOf(address).call().then(tknBalance => {
            console.log(`${address} has ${web3.utils.fromWei(tknBalance)} ITT`)
            return parseFloat(web3.utils.fromWei(tknBalance))
        })
    }
}