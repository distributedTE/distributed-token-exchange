var FixedSupplyToken = artifacts.require('./token/FixedSupplyToken.sol');
var Exchange = artifacts.require('./Exchange.sol');

var Order = artifacts.require('./libs/Order.sol');
var OrderBook = artifacts.require('./libs/OrderBook.sol');

module.exports = function(deployer) {
  deployer.deploy(FixedSupplyToken);
  deployer.deploy(Order);
  deployer.deploy(OrderBook);
  deployer.link(Order, Exchange);
  deployer.link(OrderBook, Exchange);
  deployer.deploy(Exchange);
};
