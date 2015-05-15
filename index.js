#!/usr/bin/env node

var http = require('http')
var qs = require('querystring')
var path = require('path')
var url = require('url')
var bip39 = require('bip39')
var Blockchain = require('cb-insight')
var chalk = require('chalk')
var coininfo = require('coininfo')
var CoinKey = require('coinkey')
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

var server = http.createServer(function (req, res) {
  // default to HTML and HTTP OK
  res.setHeader('Content-Type', 'text/plain')
  res.statusCode = 200

  var urlData = url.parse(req.url)
  switch (req.method) {
    case 'GET':
      switch (urlData.pathname) {
        case '/':
          res.end('Please send funds back to: ' + ck.publicAddress)
          break
        case '/bitcoin/testnet/withdrawal':
          var params = qs.parse(urlData.query)
          if (!params.address) {
            res.statusCode = 422
            return res.end('You forgot to set the "address" parameter.')
          }

          // satoshis
          var amount = parseInt(params.amount, 10) || 10000

          // all responses will now be JSON
          res.setHeader('Content-Type', 'application/json')

          spend(ck.privateWif, params.address, amount, function (err, txId) {
            if (err) return res.end(JSON.stringify({status: 'error', data: {message: err.message}}))
            res.end(JSON.stringify({status: 'success', data: {txId: txId}}))
          })
          break
      }
      break
  }
})

server.listen(PORT, function (err) {
  if (err) console.error(err)
  console.log('\n  bitcoin-faucet listening on port %s', chalk.blue.bold(PORT))
  console.log('  deposit funds to: %s', chalk.green.bold(ck.publicAddress))
})
