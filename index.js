#!/usr/bin/env node

var http = require('http')
var path = require('path')
var bip39 = require('bip39')
var Blockchain = require('cb-insight')
var chalk = require('chalk')
var coininfo = require('coininfo')
var CoinKey = require('coinkey')
var express = require('express')
var fs = require('fs-extra')
var HDKey = require('hdkey')
var spend = require('spend')

var KEY_PATH = "m/44'/1'/0'/0/0" // first BIP44 Bitcoin Testnet External address
var WALLET_FILE = process.env.FAUCET_WALLET || path.join(process.env.HOME || process.env.USERPROFILE, '.bitcoin-faucet', 'wallet.json')
var PORT = process.env.FAUCET_PORT || 14004

// initialize wallet
var data
if (!fs.existsSync(WALLET_FILE)) {
  data = {
    mnemonic: bip39.generateMnemonic()
  }
  fs.outputJsonSync(WALLET_FILE, data)
} else {
  data = fs.readJsonSync(WALLET_FILE)
}

var hdkey = HDKey.fromMasterSeed(bip39.mnemonicToSeed(data.mnemonic)).derive(KEY_PATH)
var privateKey = hdkey.privateKey
var ck = new CoinKey(privateKey, coininfo.bitcoin.test)

spend.blockchain = new Blockchain('https://test-insight.bitpay.com')

var app = express()
app.get('/', function (req, res) {
  var pkg = require('./package')
  res.set('Content-Type', 'text/plain')
  res.end('bitcoin-faucet version: ' + pkg.version + '\n\nPlease send funds back to: ' + ck.publicAddress)
})

// only bitcoin testnet supported for now
app.get('/:coin/:network/withdrawal', function (req, res) {
  if (!req.query.address) {
    res.status(422).send({ status: 'error', data: { message: 'You forgot to set the "address" parameter.' } })
  }

  // satoshis
  var amount = parseInt(req.query.amount, 10) || 10000

  spend(ck.privateWif, req.query.address, amount, function (err, txId) {
    if (err) return res.status(500).send({status: 'error', data: {message: err.message}})
    res.send({status: 'success', data: {txId: txId}})
  })
})

var server = http.createServer(app)

server.listen(PORT, function (err) {
  if (err) console.error(err)
  console.log('\n  bitcoin-faucet listening on port %s', chalk.blue.bold(PORT))
  console.log('  deposit funds to: %s', chalk.green.bold(ck.publicAddress))
})
