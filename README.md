Bitcoin Faucet
==============

A Node.js app to easily create a programmable Bitcoin Testnet faucet. This allows you to
easily test your Bitcoin applications.


Installation
------------

    npm i -g bitcoin-faucet


Usage
-----

run:

    bitcoin-faucet

outputs something like:

      bitcoin-faucet listening on port 14004
      deposit funds to: n2hBww8z4cZE68SETVTAu4BvM52EpPVo7S


### ENV VARS

You can configure the faucet with the following commands:

- `FAUCET_PORT`: defaults to `14004`
- `FAUCET_WALLET`: defaults to `~/.bitcoin-faucet/wallet`. It's a plain text file with the faucet private key in WIF.
- `PRIVKEY`: the faucet private key in WIF


### Request Funds

CURL or make browser GET request to `/withdrawal` with params `address` and optional `amount`. If amount not specified, 10000 satoshi is used.

**Example**:

    http://localhost:14004/withdrawal?address=msj42CCGruhRsFrGATiUuh25dtxYtnpbTx&amount=25000

response:

    {
      "status": "success",
      "data": {
        "txId": "7b139bdba00cbe506087444caa899b8c94cfac4ab660e0f64a50325cb41c458c"
      }
    }


#### Why GET?

While a `POST` probably would have been proper, a `GET` is super simple to implement and
easy to make requests in the browser.


Run as Mac OS X Service
-----------------------

Running it as a Mac OS X service allows you to always access it while developing.

Create the following file:

**~/Library/LaunchAgents/com.coinbolt.bitcoin-faucet**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.coinbolt.bitcoin-faucet</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/Users/jp/.nvm/v0.10.32/bin:$PATH</string>
  </dict>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/jp/.nvm/v0.10.32/bin/bitcoin-faucet</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/jp/.bitcoin-faucet</string>
  <key>StandardOutPath</key>
  <string>/Users/jp/.bitcoin-faucet/bitcoin-faucet.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/jp/.bitcoin-faucet/bitcoin-faucet.log</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

Configure the settings appropriate to your environment. Make sure that the `PATH`
above is pointing to the location of `node`.

Then run

    launchctl load ~/Library/LaunchAgents/com.coinbolt.bitcoin-faucet.plist


License
-------

MIT

