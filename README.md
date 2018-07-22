# Distributed Token Exchange Example

> An example of the DApp that demonstrates exchanging of tokens.

**WORK IN PROGRESS !!! There are functionalities that are not working properly yet.**

## Solutions

- [Solidity](http://solidity.readthedocs.io/en/v0.4.24/)
- [Truffle](https://truffleframework.com/)
- [Drizzle](https://truffleframework.com/docs/drizzle/getting-started)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/) (types not fully prepared yet)
- [ganache-cli](https://github.com/trufflesuite/ganache-cli) (for testing and development)

## Running the app

```
ganache-cli

cd CryptoExchange
truffle migrate

yarn link
cd app
yarn install
yarn link "distributed-token-exchange"
yarn start
```

- Open the app at http://localhost:3000

## Running tests

```
ganache-cli

cd CryptoExchange
npm install
truffle test
```

## Issues

If you don't see the result of the action on the screen try one of the following:

1.  Try to refresh the browser
2.  Change MetaMask network and go back to the local one - it seems sometimes MetaMask gets stuck
3.  If you still are not sure if the transaction was successfull, you can check it on Redux DevTools or in ganache-cli console
