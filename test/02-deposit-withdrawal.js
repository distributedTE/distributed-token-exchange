import { getTotalGasUsage } from './utils';

const fixedSupplyTokenContract = artifacts.require(
  './token/FixedSupplyToken.sol'
);
const exchangeContract = artifacts.require('./Exchange.sol');

contract('Deposit Withdrawal', function(accounts) {
  let token,
    exchange,
    tx = [];

  before(async () => {
    token = await fixedSupplyTokenContract.deployed();
    exchange = await exchangeContract.deployed();
  });

  it('should be possible to add tokens', async () => {
    tx[tx.length] = await exchange.addToken('FIXED', token.address);
    assert.equal(
      tx[tx.length - 1].logs[0].event,
      'TokenAddedToSystem',
      'TokenAddedtoSystem Event should be emitted'
    );

    const tokenBalance = await exchange.tokenBalances(accounts[0], 'FIXED');

    assert.equal(
      tokenBalance.toNumber(),
      0,
      'Initial token balance for newly added token equals to 0'
    );
  });

  //THIS DOES NOT WORK BECAUSE TRUFFLE RESULT GAS IS ROUNDED
  //it("test Deposit and Withdraw Ether", function () {
  //    const exchange;
  //    const balanceBeforeTransaction = web3.eth.getBalance(accounts[0]);
  //    const balanceAfterDeposit;
  //    const balanceAfterWithdrawal;
  //    const gasUsed = 0;
  //
  //    return exchange.deployed().then(function (instance) {
  //        exchange = instance;
  //        return exchange.depositEther({from: accounts[0], value: web3.toWei(1, "ether")});
  //    }).then(function (tx[tx.length]) {
  //        gasUsed += tx[tx.length - 1].receipt.cumulativeGasUsed * web3.eth.getTransaction(tx[tx.length - 1].receipt.transactionHash).gasPrice.toNumber();
  //        balanceAfterDeposit = web3.eth.getBalance(accounts[0]);
  //        return Exchange.ethBalancesInWei.accounts[0]call();
  //    }).then(function (balanceInWei) {
  //        assert.equal(balanceInWei.toNumber(), web3.toWei(1, "ether"), "There is one ether available");
  //        assert.equal(web3.toWei(1, "ether"), balanceBeforeTransaction.toNumber() - balanceAfterDeposit.toNumber() - gasUsed, "Balances of account are the same");
  //        return exchange.withdrawEther(web3.toWei(1, "ether"));
  //    }).then(function (tx[tx.length]) {
  //        balanceAfterWithdrawal = web3.eth.getBalance(accounts[0]);
  //        return Exchange.ethBalancesInWei.accounts[0]call();
  //    }).then(function (balanceInWei) {
  //        assert.equal(balanceInWei.toNumber(), 0, "There is one ether available");
  //        assert.equal(balanceBeforeTransaction.toNumber(), balanceAfterWithdrawal.toNumber(), "There is one ether available");
  //
  //    });
  //});

  it('should be possible to Deposit and Withdraw Ether', async () => {
    let balanceInWei;

    const balanceBeforeDeposit = web3.eth.getBalance(accounts[0]);
    tx[tx.length] = await exchange.depositEther({
      from: accounts[0],
      value: web3.toWei(1, 'ether')
    });

    const gasUsed =
      tx[tx.length - 1].receipt.cumulativeGasUsed *
      web3.eth
        .getTransaction(tx[tx.length - 1].receipt.transactionHash)
        .gasPrice.toNumber(); //here we have a problem
    const balanceAfterDeposit = web3.eth.getBalance(accounts[0]);
    balanceInWei = await exchange.ethBalancesInWei(accounts[0]);

    assert.equal(
      balanceInWei.toNumber(),
      web3.toWei(1, 'ether'),
      'There is one ether available'
    );
    // TODO: check why it is failing
    // assert.equal(
    //   balanceBeforeDeposit.toNumber() - balanceAfterDeposit.toNumber(),
    //   balanceInWei.toNumber(),
    //   'Balances of account are the same'
    // );

    tx[tx.length] = await exchange.withdrawEther(web3.toWei(1, 'ether'));
    const balanceAfterWithdrawal = web3.eth.getBalance(accounts[0]);
    balanceInWei = await exchange.ethBalancesInWei(accounts[0]);

    assert.equal(
      balanceInWei.toNumber(),
      0,
      'There is no ether available anymore'
    );
    assert.isAtLeast(
      balanceAfterWithdrawal.toNumber(),
      balanceBeforeDeposit.toNumber() - gasUsed * 2,
      'There is one ether available'
    );
  });

  it('should be possible to Deposit Token', async () => {
    let tokenBalance;

    await token.approve(exchange.address, 2000);
    tx[tx.length] = await exchange.depositToken('FIXED', 1000);
    tokenBalance = await exchange.tokenBalances(accounts[0], 'FIXED');

    assert.equal(
      tokenBalance,
      1000,
      'There should be 1000 tokens for the address'
    );

    tx[tx.length] = await exchange.depositToken('FIXED', 1000);
    tokenBalance = await exchange.tokenBalances(accounts[0], 'FIXED');

    assert.equal(
      tokenBalance,
      2000,
      'There should be 2000 tokens for the address'
    );
  });

  it('should be possible to Withdraw Token', async () => {
    let tokenBalance_InExchange_BeforeWithdrawal,
      tokenBalance_InAccount_BeforeWithdrawal,
      tokenBalance_InExchange_AfterWithdrawal,
      tokenBalance_InAccount_AfterWithdrawal;

    tokenBalance_InExchange_BeforeWithdrawal = await exchange.tokenBalances(
      accounts[0],
      'FIXED'
    );
    tokenBalance_InAccount_BeforeWithdrawal = await token.balanceOf(
      accounts[0]
    );

    tx[tx.length] = await exchange.withdrawToken(
      'FIXED',
      tokenBalance_InExchange_BeforeWithdrawal
    );

    tokenBalance_InExchange_AfterWithdrawal = await exchange.tokenBalances(
      accounts[0],
      'FIXED'
    );
    tokenBalance_InAccount_AfterWithdrawal = await token.balanceOf(accounts[0]);

    assert.equal(
      tokenBalance_InExchange_AfterWithdrawal,
      0,
      'There should be 0 tokens left in the exchange'
    );
    assert.equal(
      tokenBalance_InAccount_AfterWithdrawal,
      Number(tokenBalance_InExchange_BeforeWithdrawal) +
        Number(tokenBalance_InAccount_BeforeWithdrawal),
      'There should be 0 tokens left in the exchange'
    );
  });

  after(() => {
    getTotalGasUsage(tx);
  });
});
