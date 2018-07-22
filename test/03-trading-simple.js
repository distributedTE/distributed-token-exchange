import { getTotalGasUsage } from './utils';

const fixedSupplyTokenContract = artifacts.require(
  './token/FixedSupplyToken.sol'
);
const exchangeContract = artifacts.require('./Exchange.sol');

contract('Simple Trading', function(accounts) {
  let token, exchange, tx;

  before(async () => {
    token = await fixedSupplyTokenContract.deployed();
    exchange = await exchangeContract.deployed();

    tx = [
      await exchange.depositEther({
        from: accounts[0],
        value: web3.toWei(3, 'ether')
      }),
      await exchange.addToken('FIXED', token.address),
      await token.approve(exchange.address, 2000),
      await exchange.depositToken('FIXED', 2000)
    ];
  });

  it('should be possible to add a limit buy order', async () => {
    let buyPrices, buyVolumes;
    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');

    assert.equal(buyPrices.length, 0, 'OrderBook should have 0 buy offers');

    tx[tx.length] = await exchange.buyToken(
      'FIXED',
      5,
      web3.toWei(1, 'finney')
    );

    assert.equal(
      tx[tx.length - 1].logs.length,
      1,
      'There should have been one Log Message emitted.'
    );
    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'LimitBuyOrderCreated',
      'The Log-Event should be LimitBuyOrderCreated'
    );

    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');
    assert.equal(buyPrices.length, 1, 'OrderBook should have 0 buy offers');
    assert.equal(
      buyVolumes.length,
      1,
      'OrderBook should have 0 buy volume has one element'
    );
  });

  it('should be possible to add three limit buy orders', async () => {
    let buyPrices, buyVolumes;
    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');
    const orderBookLengthBeforeBuy = buyPrices.length;

    //we add one offer on top of another one, doesn't increase the orderBook
    tx[tx.length] = await exchange.buyToken(
      'FIXED',
      5,
      web3.toWei(2, 'finney')
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'LimitBuyOrderCreated',
      'The Log-Event should be LimitBuyOrderCreated'
    );

    //we add a new offer in the middle
    tx[tx.length] = await exchange.buyToken(
      'FIXED',
      5,
      web3.toWei(1.4, 'finney')
    );

    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');

    assert.equal(
      buyPrices.length,
      orderBookLengthBeforeBuy + 2,
      'OrderBook should have one more buy offers'
    );
    assert.equal(
      buyVolumes.length,
      orderBookLengthBeforeBuy + 2,
      'OrderBook should have 2 buy volume elements'
    );
  });

  it('should be possible to add two limit sell orders', async () => {
    let sellPrices, sellVolumes;
    [sellPrices, sellVolumes] = await exchange.getSellOrderBook('FIXED');
    tx[tx.length] = await exchange.sellToken(
      'FIXED',
      5,
      web3.toWei(3, 'finney')
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'LimitSellOrderCreated',
      'The Log-Event should be LimitSellOrderCreated'
    );

    tx[tx.length] = await exchange.sellToken(
      'FIXED',
      5,
      web3.toWei(6, 'finney')
    );

    [sellPrices, sellVolumes] = await exchange.getSellOrderBook('FIXED');

    assert.equal(sellPrices.length, 2, 'OrderBook should have 2 sell offers');
    assert.equal(
      sellVolumes.length,
      2,
      'OrderBook should have 2 sell volume elements'
    );
  });

  it('should be possible to create and cancel a buy order', async () => {
    let buyPrices, buyVolumes;
    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');
    const orderBookLengthBeforeBuy = buyPrices.length;

    tx[tx.length] = await exchange.buyToken(
      'FIXED',
      5,
      web3.toWei(2.2, 'finney')
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'LimitBuyOrderCreated',
      'The Log-Event should be LimitBuyOrderCreated'
    );

    const orderKey = tx[tx.length - 1].logs[0].args._offersLength - 1;
    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');
    const orderBookLengthAfterBuy = buyPrices.length;

    assert.equal(
      orderBookLengthAfterBuy,
      orderBookLengthBeforeBuy + 1,
      'OrderBook should have 1 buy offers more than before'
    );

    tx[tx.length] = await exchange.cancelOrder(
      'FIXED',
      false,
      web3.toWei(2.2, 'finney'),
      0
    );

    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'BuyOrderCanceled',
      'The Log-Event should be BuyOrderCanceled'
    );

    [buyPrices, buyVolumes] = await exchange.getBuyOrderBook('FIXED');
    const orderBookLengthAfterCancel = buyPrices.length;

    assert.equal(
      orderBookLengthAfterCancel,
      orderBookLengthAfterBuy,
      'OrderBook should have 1 buy offers, its not cancelling it out completely, but setting the volume to zero'
    );
    assert.equal(
      buyVolumes[orderBookLengthAfterCancel - 1],
      0,
      'The available Volume should be zero'
    );
  });

  after(() => {
    getTotalGasUsage(tx);
  });
});
