// TODO: check why we always needed .call() at the end of the function

const fixedSupplyTokenContract = artifacts.require(
  './token/FixedSupplyToken.sol'
);

contract('Fixed Supply Token Test', function(accounts) {
  let token;

  before(async () => {
    token = await fixedSupplyTokenContract.deployed();
  });

  it('first account should own all tokens', async () => {
    let accountBalance, totalTokenSupply;

    totalTokenSupply = await token.totalSupply();
    accountBalance = await token.balanceOf(accounts[0]);

    assert.equal(
      Number(accountBalance),
      Number(totalTokenSupply),
      'Total Amount of tokens is not owned by owner'
    );
  });

  it('second account should own no tokens', async () => {
    let accountBalance;

    accountBalance = await token.balanceOf(accounts[1]);

    assert.equal(
      Number(accountBalance),
      0,
      'Total Amount of tokens is owned by some other address'
    );
  });

  it('should send token correctly', async () => {
    let senderStartBalance,
      receiverStartBalance,
      senderEndBalance,
      receiverEndBalance;
    const amount = 10;

    // Get initial balances of sender (account[0]) and receiver (accounts[1]) account.
    senderStartBalance = await token.balanceOf(accounts[0]);
    receiverStartBalance = await token.balanceOf(accounts[1]);

    await token.transfer(accounts[1], amount, {
      from: accounts[0]
    });

    senderEndBalance = await token.balanceOf(accounts[0]);
    receiverEndBalance = await token.balanceOf(accounts[1]);

    assert.equal(
      senderEndBalance.toNumber(),
      senderStartBalance.toNumber() - amount,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      receiverEndBalance.toNumber(),
      receiverStartBalance.toNumber() + amount,
      "Amount wasn't correctly sent to the receiver"
    );
  });
});
