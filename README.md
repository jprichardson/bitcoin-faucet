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
- `FAUCET_FILE`: defaults to `~/.bitcoin-faucet/wallet.json`


### Request Funds

CURL or make browser GET request to `/withdrawal` with params `address` and optional `amount`.

**Example**:

    http://localhost:14004/bitcoin/testnet/withdrawal?address=msj42CCGruhRsFrGATiUuh25dtxYtnpbTx&amount=25000

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



License
-------

MIT


