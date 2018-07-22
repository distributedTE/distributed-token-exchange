pragma solidity ^0.4.24;

import "./math/SafeMath.sol";
import "./token/ERC20Interface.sol";
import "./ownership/Ownable.sol";

import "./libs/Data.sol";
import "./libs/OrderBook.sol";
import "./libs/Order.sol";

contract Exchange is Ownable {
    using SafeMath for uint;

    mapping (bytes16 => Data.Token) public tokens;
    bytes16[] public tokenNames;

    mapping (address => mapping (bytes16 => Data.Balance)) public tokenBalances;
    mapping (address => Data.Balance) public ethBalancesInWei;

    ////////////
    // EVENTS //
    ////////////

    // TODO: Check if we need indexed next to tokenName
    event DepositForTokenReceived(address indexed from, bytes16 tokenName, uint amount, uint timestamp);

    event WithdrawalToken(address indexed to, bytes16 tokenName, uint amount, uint timestamp);

    event SendTokenTo(address from, address to, bytes16 tokenName, uint amount, uint timestamp);

    event DepositForEthReceived(address indexed from, uint amount, uint timestamp);

    event WithdrawalEth(address indexed to, uint amount, uint timestamp);

    event TokenAddedToSystem(address sender, bytes16 tokenName, uint tokenNamesLength, uint timestamp);

    // Order Events
    event SellOrderFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    event SellOrderPartiallyFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    event BuyOrderFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    event BuyOrderPartiallyFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    // Order Book Events 
    event SellOrderCanceled(bytes16 tokenName, uint priceInWei, uint orderKey);

    event BuyOrderCanceled(bytes16 tokenName, uint priceInWei, uint orderKey);

    event LimitBuyOrderCreated(bytes16 tokenName, address indexed who, uint amountTokens, uint priceInWei, uint offersLength);

    event LimitSellOrderCreated(bytes16 tokenName, address indexed who, uint amountTokens, uint priceInWei, uint offersLength);

    //////////////////////////////////
    // ETHER MANAGEMENT //
    //////////////////////////////////
    function depositEther() external payable {
        Data.Balance storage ethBalance = ethBalancesInWei[msg.sender];
        ethBalance.value = ethBalance.value.add(msg.value);
        emit DepositForEthReceived(msg.sender, msg.value, now);
    }

    function withdrawEther(uint _amountInWei) external {
        Data.Balance storage ethBalance = ethBalancesInWei[msg.sender];
        ethBalance.value = ethBalance.value.sub(_amountInWei);
        msg.sender.transfer(_amountInWei);
        emit WithdrawalEth(msg.sender, _amountInWei, now);
    }

    function addEthBalanceInWei(address _who, uint _amount) external {
        Data.Balance storage ethBalanceInWei = ethBalancesInWei[_who];
        ethBalanceInWei.value = ethBalanceInWei.value.add(_amount);
    }
    function substractEthBalanceInWei(address _who, uint _amount) external {
        Data.Balance storage ethBalanceInWei = ethBalancesInWei[_who];
        ethBalanceInWei.value = ethBalanceInWei.value.sub(_amount);
    }


    //////////////////////
    // TOKEN MANAGEMENT //
    //////////////////////

    function addToken(bytes16 _tokenName, address _erc20TokenAddress) external {
        Data.Token storage token = getToken(_tokenName);
        token.contractAddress = _erc20TokenAddress;
        token.name = _tokenName;
        tokenBalances[msg.sender][_tokenName].value = 0;
        tokenNames.push(_tokenName);
        emit TokenAddedToSystem(msg.sender, _tokenName, tokenNames.length, now);
    }

    function depositToken(bytes16 _tokenName, uint _amount) external {
        Data.Token storage token = getToken(_tokenName);
        Data.Balance storage tokenBalance = tokenBalances[msg.sender][_tokenName];
        ERC20Interface tokenContract = ERC20Interface(token.contractAddress);

        require(tokenContract.transferFrom(msg.sender, address(this), _amount) == true);
        tokenBalance.value = tokenBalance.value.add(_amount);

        emit DepositForTokenReceived(msg.sender, _tokenName, _amount, now);
    }

    function withdrawToken(bytes16 _tokenName, uint _amount) external {
        Data.Token storage token = getToken(_tokenName);
        Data.Balance storage tokenBalanceForAddress = tokenBalances[msg.sender][_tokenName];
        ERC20Interface tokenContract = ERC20Interface(token.contractAddress);

        require(tokenContract.transfer(msg.sender, _amount) == true);
        tokenBalanceForAddress.value = tokenBalanceForAddress.value.sub(_amount);

        emit WithdrawalToken(msg.sender, _tokenName, _amount, now);
    }

    function sendTokenTo(address _to, bytes16 _tokenName, uint _amount) external {
        Data.Token storage token = getToken(_tokenName);
        Data.Balance storage tokenBalance = tokenBalances[msg.sender][_tokenName];
        ERC20Interface tokenContract = ERC20Interface(token.contractAddress);

        require(tokenContract.transferFrom(address(this), _to, _amount) == true);
        tokenBalance.value = tokenBalance.value.sub(_amount);

        emit SendTokenTo(msg.sender, _to, _tokenName, _amount, now);
    }

    // we need to define this getter, because default one is not correct to return the whole array
    function getTokenNames() external view returns (bytes16[]) {
        return tokenNames;
    }

    function getToken(bytes16 _tokenName) internal view returns (Data.Token storage) {
        require(tokens[_tokenName].contractAddress != address(this));
        return tokens[_tokenName];
    }

    function addTokenBalance(address _who, bytes16 _tokenName, uint _amount) external returns (uint) {
        Data.Balance storage tokenBalance = tokenBalances[_who][_tokenName];
        tokenBalance.value = tokenBalance.value.add(_amount);
        return tokenBalance.value;
    }
    function substractTokenBalance(address _who, bytes16 _tokenName, uint _amount) external returns (uint) {
        Data.Balance storage tokenBalance = tokenBalances[_who][_tokenName];
        tokenBalance.value = tokenBalance.value.sub(_amount);
        return tokenBalance.value;
    }

    //////////////////////////////////
    // ORDER //
    //////////////////////////////////
    function buyToken(bytes16 _tokenName, uint _amount, uint _priceInWei) external {
        require(_amount > 0);
        require(_priceInWei > 0);

        Data.Token storage token = getToken(_tokenName);
        Data.Balance storage ethBalance = ethBalancesInWei[msg.sender];

        if (token.amountSellPrices == 0 || token.currentSellPrice > _priceInWei) {
            OrderBook.addBuyLimitOrder(_amount, _priceInWei, token, ethBalance);
        }
        else {
            uint leftAmountNecessary = Order.buyToken(_amount, _priceInWei, token, address(this));

            if (leftAmountNecessary > 0) {
                OrderBook.addBuyLimitOrder(leftAmountNecessary, _priceInWei, token, ethBalance);
            }
        }
    }

    function sellToken(bytes16 _tokenName, uint _amount, uint _priceInWei) external {
        require(_amount > 0);
        require(_priceInWei > 0);

        Data.Token storage token = getToken(_tokenName);
        Data.Balance storage tokenBalance = tokenBalances[msg.sender][token.name];

        if (token.amountBuyPrices == 0 || token.currentBuyPrice < _priceInWei) {
            OrderBook.addSellLimitOrder(_amount, _priceInWei, token, tokenBalance);
        }
        else {
            uint leftAmountNecessary = Order.sellToken(_amount, _priceInWei, token, address(this));

            if (leftAmountNecessary > 0) {
                OrderBook.addSellLimitOrder(leftAmountNecessary, _priceInWei, token, tokenBalance);
            }
        }
    }

    //////////////////////////////////
    // ORDER BOOK //
    //////////////////////////////////
    function getBuyOrderBook(bytes16 _tokenName) external view returns (uint[], uint[], uint[], uint[]) {
        Data.Token storage token = getToken(_tokenName);
        return OrderBook.getBuyOrderBook(token);
    }

    function getSellOrderBook(bytes16 _tokenName) external view returns (uint[], uint[], uint[], uint[]) {
        Data.Token storage token = getToken(_tokenName);
        return OrderBook.getSellOrderBook(token);
    }

    function cancelOrder(bytes16 _tokenName, bool _isSellOrder, uint _priceInWei, uint _offerKey) external {
        Data.Token storage token = getToken(_tokenName);
        Data.Balance storage tokenBalance = tokenBalances[msg.sender][_tokenName];

        OrderBook.cancelOrder(_isSellOrder, _priceInWei, _offerKey, token, tokenBalance);
    }
}
