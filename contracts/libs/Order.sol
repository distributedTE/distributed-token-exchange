pragma solidity ^0.4.24;

import "../Exchange.sol";
import "../math/SafeMath.sol";
import "../token/ERC20Interface.sol";

import "./Data.sol";
import "./OrderBook.sol";

library Order {
    using SafeMath for uint;

    ////////////
    // EVENTS //
    ////////////

    event SellOrderFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    event SellOrderPartiallyFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    event BuyOrderFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

    event BuyOrderPartiallyFulfilled(bytes16 tokenName, uint amount, uint priceInWei, uint offersLength);

        ////////////////////////////
    // NEW ORDER - BID ORDER //
    ///////////////////////////
    function buyToken(
        uint _amount,
        uint _priceInWei,
        Data.Token storage token,
        address exchangeAddress
    ) internal returns (uint) {
        //market order: current sell price is smaller or equal to buy price!

        //1st: find the "cheapest sell price" that is lower than the buy amount  [buy: 60@5000] [sell: 50@4500] [sell: 5@5000]
        //2: buy up the volume for 4500
        //3: buy up the volume for 5000
        //if still something remaining -> buyToken

        //2: buy up the volume
        //2.1 add ether to seller, add tokenName to buyer until i <= offers_length

        uint price = token.currentSellPrice;
        uint leftAmountNecessary = _amount;
        uint tokenBalance;

        Exchange exchange = Exchange(exchangeAddress);
        ERC20Interface tokenContract = ERC20Interface(token.contractAddress);

        //we start with the smallest sell price.
        while (price > 0 && price <= _priceInWei && leftAmountNecessary > 0) {
            Data.OrderBook storage sellBook = token.sellBook[price];
            Data.OrderBook storage buyBook = token.buyBook[price];

            for (uint i = 0; i < sellBook.offers.length && leftAmountNecessary > 0; i++) {
                Data.Offer storage offer = sellBook.offers[i];
                uint volumeAtPrice = offer.amount;

                //Two choices from here:
                //1) one person offers not enough volume to fulfill the market order - we use it up completely and move on to the next person who offers the tokenName
                //2) else: we make use of parts of what a person is offering - lower his _amount, fulfill out order.
                if (volumeAtPrice <= leftAmountNecessary) {
                    exchange.substractEthBalanceInWei(msg.sender, volumeAtPrice.mul(price));
                    tokenBalance = exchange.addTokenBalance(msg.sender, token.name, volumeAtPrice);
                    offer.amount = 0;
                    exchange.addEthBalanceInWei(offer.who, volumeAtPrice.mul(price));

                    emit SellOrderFulfilled(token.name, volumeAtPrice, price, i);

                    leftAmountNecessary = leftAmountNecessary.sub(volumeAtPrice);
                }
                else {
                    //first deduct the amount of ether from our balance
                    // TODO: check if we can create additional variable to store total
                    exchange.substractEthBalanceInWei(msg.sender, leftAmountNecessary.mul(price));
                    offer.amount = offer.amount.sub(leftAmountNecessary);
                    exchange.addEthBalanceInWei(offer.who, leftAmountNecessary.mul(price));
                    tokenBalance = exchange.addTokenBalance(msg.sender, token.name, leftAmountNecessary);

                    emit SellOrderFulfilled(token.name, leftAmountNecessary, price, i);

                    leftAmountNecessary = 0;
                    //we have fulfilled our order
                }

                tokenContract.approve(exchangeAddress, tokenBalance);

                //if it was the last offer for that price, we have to set the currentBuyPrice now lower. Additionally we have one offer less...
                if ( i == sellBook.offers.length - 1 && offer.amount == 0) {

                    // TODO: check how to replace it
                    token.amountSellPrices--;
                    //we have one price offer less here...
                    //next price
                    if (price == sellBook.higherPrice || buyBook.higherPrice == 0) {
                        token.currentSellPrice = 0;
                        //we have reached the last price
                    }
                    else {
                        token.currentSellPrice = sellBook.higherPrice;
                        token.sellBook[buyBook.higherPrice].lowerPrice = 0;
                    }
                }
            }

            //we set the currentSellPrice again, since when the volume is used up for a lowest price the currentSellPrice is set there...
            price = token.currentSellPrice;
        }

        return leftAmountNecessary;
    }

    ////////////////////////////
    // NEW ORDER - ASK ORDER //
    ///////////////////////////
    function sellToken(
        uint _amount,
        uint _priceInWei,
        Data.Token storage token,
        address exchangeAddress
    ) internal returns (uint) {
        //market order: current buy price is bigger or equal to sell price!

        //1st: find the "highest buy price" that is higher than the sell amount  [buy: 60@5000] [buy: 50@4500] [sell: 500@4000]
        //2: sell up the volume for 5000
        //3: sell up the volume for 4500
        //if still something remaining -> sellToken limit order

        //2: sell up the volume
        //2.1 add ether to seller, add tokenName to buyer until i <= offers_length

        uint price = token.currentBuyPrice;
        uint leftAmountNecessary = _amount;
        uint tokenBalance;

        Exchange exchange = Exchange(exchangeAddress);
        ERC20Interface tokenContract = ERC20Interface(token.contractAddress);

        //we start with the highest buy price.
        while (price >= _priceInWei && leftAmountNecessary > 0) {
            Data.OrderBook storage buyBook = token.buyBook[price];
            Data.Offer[] storage offersAtPrice = buyBook.offers;

            for (uint i = 0; i < offersAtPrice.length && leftAmountNecessary > 0; i++) {
                Data.Offer storage offer = offersAtPrice[i];
                uint volumeAtPrice = offer.amount;

                //Two choices from here:
                //1) one person offers not enough volume to fulfill the market order - we use it up completely and move on to the next person who offers the tokenName
                //2) else: we make use of parts of what a person is offering - lower his _amount, fulfill out order.
                if (volumeAtPrice <= leftAmountNecessary) {
                    //actually subtract the amount of tokens to change it then
                    tokenBalance = exchange.substractTokenBalance(msg.sender, token.name, volumeAtPrice);

                    //this guy offers less or equal the volume that we ask for, so we use it up completely.
                    exchange.addTokenBalance(offer.who, token.name, volumeAtPrice);
                    offer.amount = 0;
                    exchange.addEthBalanceInWei(msg.sender, volumeAtPrice.mul(price));

                    emit BuyOrderFulfilled(token.name, volumeAtPrice, price, 1);

                    leftAmountNecessary = leftAmountNecessary.sub(volumeAtPrice);
                }
                else {
                    //we take the rest of the outstanding amount

                    //actually subtract the amount of tokens to change it then
                    tokenBalance = exchange.substractTokenBalance(msg.sender, token.name, leftAmountNecessary);

                    //this guy offers more than we ask for. We reduce his stack, add the eth to us and the tokenName to him.
                    offer.amount = offer.amount.sub(leftAmountNecessary);
                    exchange.addEthBalanceInWei(msg.sender, leftAmountNecessary.mul(price));
                    exchange.addTokenBalance(offer.who, token.name, leftAmountNecessary);

                    emit BuyOrderFulfilled(token.name, leftAmountNecessary, price, 2);

                    leftAmountNecessary = 0;
                    //we have fulfilled our order
                }

                tokenContract.approve(exchangeAddress, tokenBalance);

                //if it was the last offer for that price, we have to set the currentBuyPrice now lower. Additionally we have one offer less...
                if ( i == offersAtPrice.length - 1 && offer.amount == 0) {

                    token.amountBuyPrices = token.amountBuyPrices.sub(1);
                    //we have one price offer less here...
                    //next price
                    if (price == buyBook.lowerPrice || buyBook.lowerPrice == 0) {
                        token.currentBuyPrice = 0;
                        //we have reached the last price
                    }
                    else {  
                        token.currentBuyPrice = buyBook.lowerPrice;
                        token.buyBook[buyBook.lowerPrice].higherPrice = token.currentBuyPrice;
                    }
                }
            }

            //we set the currentSellPrice again, since when the volume is used up for a lowest price the currentSellPrice is set there...
            price = token.currentBuyPrice;
        }

        return leftAmountNecessary;
    }
}
