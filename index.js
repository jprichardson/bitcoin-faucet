#!/usr/bin/env node

var http = require('http')
var path = require('path')
var Blockchain = require('cb-insight')
var chalk = require('chalk')
var express = require('express')
var fs = require('fs')
var bitcoin = require('bitcoinjs-lib')

var PORT = process.env.FAUCET_PORT || process.env.PORT || 14004

var privkey = process.env.PRIVKEY

if (privkey == undefined) {
  var WALLET_FILE = process.env.FAUCET_WALLET || path.join(process.env.HOME || process.env.USERPROFILE, '.bitcoin-faucet', 'wallet')

  // initialize wallet
  if (!fs.existsSync(WALLET_FILE)) {
    privkey = bitcoin.ECPair.makeRandom({network: bitcoin.networks.testnet, compressed: false}).toWIF()
    fs.writeFileSync(WALLET_FILE, privkey, 'utf-8')
  } else {
    privkey = fs.readFileSync(WALLET_FILE, 'utf-8')
  }
}

var keypair = bitcoin.ECPair.fromWIF(privkey)
var address = keypair.getAddress().toString()

var blockchain = new Blockchain('https://test-insight.bitpay.com')

var app = express()
app.get('/', function (req, res) {
  var pkg = require('./package')
  res.set('Content-Type', 'text/plain')
  res.end('bitcoin-faucet version: ' + pkg.version + '\n\nPlease send funds back to: ' + address)
})

// only bitcoin testnet supported for now
app.get('/withdrawal', function (req, res) {
  if (!req.query.address) {
    res.status(422).send({ status: 'error', data: { message: 'You forgot to set the "address" parameter.' } })
  }

  // satoshis
  var amount = parseInt(req.query.amount, 10) || 10000

  spend(keypair, req.query.address, amount, function (err, txId) {
    if (err) return res.status(500).send({status: 'error', data: {message: err.message}})
    res.send({status: 'success', data: {txId: txId}})
  })
})

function spend(keypair, toAddress, amount, callback) {
  blockchain.addresses.unspents(address, function (err, utxos) {
    if (err) return callback(err)

    var balance = utxos.reduce(function (amount, unspent) {
      return unspent.value + amount
    }, 0)

    if (amount > balance) {
      return callback(new Error('Address doesn\'t contain enough money to send.'))
    }

    var tx = new bitcoin.TransactionBuilder()
    tx.addOutput(toAddress, amount)

    var change = balance - amount
    if (change > 0) {
      tx.addOutput(address, change)
    }

    utxos.forEach(function (unspent) {
      tx.addInput(unspent.txId, unspent.vout)
    })

    utxos.forEach(function (unspent, i) {
      tx.sign(i, keypair)
    })

    var txHex = tx.build().toHex()
    blockchain.transactions.propagate(txHex, function (err, result) {
      if (err) return callback(err)

      callback(null, result.txId)
    })
  })
}

var server = http.createServer(app)

server.listen(PORT, function (err) {
  if (err) console.error(err)
  console.log('\n  bitcoin-faucet listening on port %s', chalk.blue.bold(PORT))
  console.log('  deposit funds to: %s', chalk.green.bold(address))
})
