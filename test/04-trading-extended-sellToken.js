import { getTotalGasUsage } from './utils';

const fixedSupplyTokenContract = artifacts.require(
  './token/FixedSupplyToken.sol'
);
const exchangeContract = artifacts.require('./Exchange.sol');

contract('Extended Trading Sell Token', function(accounts) {
  let exchange, token, tx;

  before(async () => {
    token = await fixedSupplyTokenContract.deployed();
    exchange = await exchangeContract.deployed();

    tx = [
      await exchange.depositEther({
        from: accounts[0],
        value: web3.toWei(3, 'ether')
      }),
      await exchange.addToken('FIXED', token.address),
      await token.transfer(accounts[1], 2000),
      await token.approve(exchange.address, 2000, { from: accounts[1] }),
      await exchange.depositToken('FIXED', 2000, { from: accounts[1] })
    ];
  });

  it('should be possible to partially fulfill buy orders', async () => {
    let buyPrices, buyVolumes, sellPrices, sellVolumes;

    [buyPrices, _] = await exchange.getBuyOrderBook('FIXED');

    assert.equal(buyPrices.length, 0, 'OrderBook should have 0 buy offers');

    // BUY TOKEN
    tx[tx.length] = await exchange.buyToken(
      'FIXED',
      5,
      web3.toWei(3, 'finney')
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'LimitBuyOrderCreated',
      'The Log-Event should be LimitBuyOrderCreated'
    );

    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');

    assert.equal(buyPrices.length, 1, 'OrderBook should have 1 buy offers');
    assert.equal(
      buyVolumes.length,
      1,
      'OrderBook should have 1 buy volume has one element'
    );
    assert.equal(
      buyVolumes[0],
      5,
      'OrderBook should have a volume of 5 coins someone wants to buy'
    );

    // SELL TOKEN
    tx[tx.length] = await exchange.sellToken(
      'FIXED',
      4,
      web3.toWei(2, 'finney'),
      {
        from: accounts[1]
      }
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'BuyOrderFulfilled',
      'The Log-Event should be BuyOrderFulfilled'
    );

    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');

    assert.equal(buyPrices.length, 1, 'OrderBook should have 1 buy offers');
    assert.equal(
      buyVolumes.length,
      1,
      'OrderBook should have 1 buy volume has one element'
    );

    [sellPrices, sellVolumes] = await exchange.getSellOrderBook('FIXED');

    assert.equal(sellPrices.length, 0, 'OrderBook should have 0 sell offers');
    assert.equal(
      sellVolumes.length,
      0,
      'OrderBook should have 0 sell volume elements'
    );
  });

  after(() => {
    getTotalGasUsage(tx);
  });
});
