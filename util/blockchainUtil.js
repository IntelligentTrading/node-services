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

        return contract.methods.decimals().call().then((decimals) => {
            return contract.methods.balanceOf(address).call().then(tknBalance => {
                var finalBalance = tknBalance / Math.pow(10, decimals)
                console.log(`${address} has ${finalBalance} ITT`)
                return parseFloat(finalBalance)
            })
        })
    },
    toContractDecimals: (decimalAmount) => toContractDecimals,
    contract: contract,
    getProviderName: () => {
        return providerEndpoint
    },
    transfer: (privateKey, toAddress, amount) => {
        return toContractDecimals(amount).then(contractAmount => {
            return transferFromITFUserWallet(privateKey, toAddress, contractAmount)
        })
    }
}


function toContractDecimals(decimalAmount) {
    return contract.methods.decimals().call().then((decimals) => {
        return decimalAmount * Math.pow(10, decimals)
    })
}

function transferFromITFUserWallet(privateKey, _to, _value) {
    var encoded = contract.methods.transfer(_to, _value).encodeABI()

    var tx = {
        to: process.env.CONTRACT_ADDRESS,
        value: 0,
        gasLimit: 100000,
        gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei')),
        data: encoded
    }

    return web3.eth.accounts.signTransaction(tx, privateKey).then(signed => {        
        return web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', console.log)
    });
}