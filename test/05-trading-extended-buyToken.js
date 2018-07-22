import { getTotalGasUsage } from './utils';

const fixedSupplyTokenContract = artifacts.require(
  './token/FixedSupplyToken.sol'
);
const exchangeContract = artifacts.require('./Exchange.sol');

contract('Extended Trading Buy Token', function(accounts) {
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
      await token.approve(exchange.address, 2000, {
        from: accounts[1]
      }),
      await exchange.depositToken('FIXED', 2000, {
        from: accounts[1]
      })
    ];
  });

  it('should be possible to fully fulfill sell orders', async () => {
    let sellPrices, sellVolumes, buyPrices, buyVolumes;

    [sellPrices, sellVolumes] = await exchange.getSellOrderBook('FIXED');

    assert.equal(sellPrices.length, 0, 'OrderBook should have 0 buy offers');

    // SELL TOKEN
    tx[tx.length] = await exchange.sellToken(
      'FIXED',
      5,
      web3.toWei(2, 'finney'),
      { from: accounts[1] }
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'LimitSellOrderCreated',
      'The Log-Event should be LimitSellOrderCreated'
    );

    [sellPrices, sellVolumes] = await exchange.getSellOrderBook('FIXED');

    assert.equal(sellPrices.length, 1, 'OrderBook should have 1 sell offers');
    assert.equal(
      sellVolumes.length,
      1,
      'OrderBook should have 1 sell volume has one element'
    );
    assert.equal(
      sellVolumes[0],
      5,
      'OrderBook should have a volume of 5 coins someone wants to sell'
    );

    // BUY TOKEN
    tx[tx.length] = await exchange.buyToken(
      'FIXED',
      5,
      web3.toWei(3, 'finney')
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'SellOrderFulfilled',
      'The Log-Event should be SellOrderFulfilled'
    );

    [sellPrices, sellVolumes] = await exchange.getSellOrderBook('FIXED');

    assert.equal(sellPrices.length, 0, 'OrderBook should have 0 sell offers');
    assert.equal(
      sellVolumes.length,
      0,
      'OrderBook should have 0 sell volume has one element'
    );

    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');

    assert.equal(buyPrices.length, 0, 'OrderBook should have 0 buy offers');
    assert.equal(
      buyVolumes.length,
      0,
      'OrderBook should have 0 buy volume elements'
    );
  });

  after(() => {
    getTotalGasUsage(tx);
  });
});
