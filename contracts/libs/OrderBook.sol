pragma solidity ^0.4.24;

import "../Exchange.sol";
import "../math/SafeMath.sol";

import "./Data.sol";

library OrderBook {
    using SafeMath for uint;

    ////////////
    // EVENTS //
    ////////////
    event SellOrderCanceled(bytes16 tokenName, uint priceInWei, uint orderKey);

    event BuyOrderCanceled(bytes16 tokenName, uint priceInWei, uint orderKey);

    event LimitBuyOrderCreated(bytes16 tokenName, address indexed who, uint amountTokens, uint priceInWei, uint offersLength);

    event LimitSellOrderCreated(bytes16 tokenName, address indexed who, uint amountTokens, uint priceInWei, uint offersLength);


    /////////////////////////////
    // ORDER BOOK - BID ORDERS //
    /////////////////////////////
    function getBuyOrderBook(Data.Token storage token) internal view returns (uint[], uint[], uint[], uint[]) {        
        uint[] memory buyPrices = new uint[](token.amountBuyPrices);
        uint[] memory buyVolumes = new uint[](token.amountBuyPrices);
        uint[] memory myBuyVolumes = new uint[](token.amountBuyPrices);
        uint[] memory myBuyOfferKeys = new uint[](token.amountBuyPrices);
        uint price = token.lowestBuyPrice;
        uint counter = 0;

        if (token.currentBuyPrice > 0) {
            while (price <= token.currentBuyPrice) {
                buyPrices[counter] = price;
                uint volumeAtPrice = 0;
                Data.OrderBook storage buyBook = token.buyBook[price];
                Data.Offer[] storage offersAtPrice = buyBook.offers;

                for (uint i = 0; i < offersAtPrice.length; i++) {
                    volumeAtPrice = volumeAtPrice.add(offersAtPrice[i].amount);
                    if (offersAtPrice[i].who == msg.sender) {
                        myBuyVolumes[counter] = offersAtPrice[i].amount;
                        myBuyOfferKeys[counter] = i;
                    }
                }

                buyVolumes[counter] = volumeAtPrice;

                //next price
                if (price == buyBook.higherPrice) {
                    break;
                }
                else {
                    price = buyBook.higherPrice;
                }
                counter++;

            }
        }

        return (buyPrices, buyVolumes, myBuyVolumes, myBuyOfferKeys);
    }


    /////////////////////////////
    // ORDER BOOK - ASK ORDERS //
    /////////////////////////////
    function getSellOrderBook(Data.Token storage token) internal view returns (uint[], uint[], uint[], uint[]) {
        uint[] memory sellPrices = new uint[](token.amountSellPrices);
        uint[] memory sellVolumes = new uint[](token.amountSellPrices);
        uint[] memory mySellVolumes = new uint[](token.amountSellPrices);
        uint[] memory mySellOfferKeys = new uint[](token.amountSellPrices);
        uint price = token.currentSellPrice;
        uint counter = 0;

        if (token.currentSellPrice > 0) {
            while (price <= token.highestSellPrice) {
                sellPrices[counter] = price;
                uint volumeAtPrice = 0;
                Data.OrderBook storage sellBook = token.sellBook[price];
                Data.Offer[] storage offersAtPrice = sellBook.offers;

                for (uint i = 0; i < offersAtPrice.length; i++) {
                    volumeAtPrice = volumeAtPrice.add(offersAtPrice[i].amount);
                    if (offersAtPrice[i].who == msg.sender) {
                        mySellVolumes[counter] = offersAtPrice[i].amount;
                        mySellOfferKeys[counter] = i;
                    }
                }

                sellVolumes[counter] = volumeAtPrice;

                //next price
                if (token.sellBook[price].higherPrice == 0) {
                    break;
                }
                else {
                    price = token.sellBook[price].higherPrice;
                }
                counter++;

            }
        }

        //sell part
        return (sellPrices, sellVolumes, mySellVolumes, mySellOfferKeys);
    }

    function addBuyLimitOrder(
        uint _amount,
        uint _priceInWei,
        Data.Token storage token,
        Data.Balance storage ethBalance
    ) internal {
        //if we have enough ether, we can buy that:
        uint total_amount_ether_necessary = _amount.mul(_priceInWei);

        //first deduct the amount of ether from our balance
        ethBalance.value = ethBalance.value.sub(total_amount_ether_necessary);

        //limit order: we don't have enough offers to fulfill the amount
        //add the order to the orderBook
        addBuyOffer(_amount, _priceInWei, msg.sender, token);
        //and emit the event.
        emit LimitBuyOrderCreated(token.name, msg.sender, _amount, _priceInWei, token.buyBook[_priceInWei].offers.length);
    }


    ///////////////////////////
    // BID LIMIT ORDER LOGIC //
    ///////////////////////////
    function addBuyOffer(uint _amount, uint _priceInWei, address _who, Data.Token storage token) private {
        Data.OrderBook storage buyBookAtOfferedPrice = token.buyBook[_priceInWei];
        Data.Offer[] storage offersAtPrice = buyBookAtOfferedPrice.offers;

        offersAtPrice.push(Data.Offer(_amount, _who));

        if (offersAtPrice.length == 1) {
            //we have a new buy order - increase the counter, so we can set the getOrderBook array later
            token.amountBuyPrices = token.amountBuyPrices.add(1);

            //lowerPrice and higherPrice have to be set
            uint currentBuyPrice = token.currentBuyPrice;
            uint lowestBuyPrice = token.lowestBuyPrice;

            if (lowestBuyPrice == 0 || lowestBuyPrice > _priceInWei) {
                if (currentBuyPrice == 0) {
                    //there is no buy order yet, we insert the first one...
                    token.currentBuyPrice = _priceInWei;
                    buyBookAtOfferedPrice.higherPrice = _priceInWei;
                    buyBookAtOfferedPrice.lowerPrice = 0;
                }
                else {
                    //or the lowest one
                    token.buyBook[lowestBuyPrice].lowerPrice = _priceInWei;
                    buyBookAtOfferedPrice.higherPrice = lowestBuyPrice;
                    buyBookAtOfferedPrice.lowerPrice = 0;
                }
                token.lowestBuyPrice = _priceInWei;
            }
            else if (currentBuyPrice < _priceInWei) {
                //the offer to buy is the highest one, we don't need to find the right spot
                token.buyBook[currentBuyPrice].higherPrice = _priceInWei;
                buyBookAtOfferedPrice.higherPrice = _priceInWei;
                buyBookAtOfferedPrice.lowerPrice = currentBuyPrice;
                token.currentBuyPrice = _priceInWei;

            }
            else {
                //we are somewhere in the middle, we need to find the right spot first...
                uint buyPrice = token.currentBuyPrice;
                bool isSpotFound = false;

                while (buyPrice > 0 && !isSpotFound) {
                    if (buyPrice < _priceInWei && token.buyBook[buyPrice].higherPrice > _priceInWei) {
                        //set the new order-book entry higher/lowerPrice first right
                        buyBookAtOfferedPrice.lowerPrice = buyPrice;
                        buyBookAtOfferedPrice.higherPrice = token.buyBook[buyPrice].higherPrice;

                        //set the higherPrice'd order-book entries lowerPrice to the current Price
                        token.buyBook[token.buyBook[buyPrice].higherPrice].lowerPrice = _priceInWei;
                        //set the lowerPrice'd order-book entries higherPrice to the current Price
                        token.buyBook[buyPrice].higherPrice = _priceInWei;

                        //set we found it.
                        isSpotFound = true;
                    }
                    buyPrice = token.buyBook[buyPrice].lowerPrice;
                }
            }
        }
    }

    function addSellLimitOrder(
        uint _amount,
        uint _priceInWei,
        Data.Token storage token,
        Data.Balance storage tokenBalance
    ) internal {
        //actually subtract the amount of tokens to change it then
        tokenBalance.value = tokenBalance.value.sub(_amount);

        //limit order: we don't have enough offers to fulfill the amount

        //add the order to the orderBook
        addSellOffer(_amount, _priceInWei, msg.sender, token);
        //and emit the event.
        emit LimitSellOrderCreated(token.name, msg.sender, _amount, _priceInWei, token.sellBook[_priceInWei].offers.length);
    }



    ///////////////////////////
    // ASK LIMIT ORDER LOGIC //
    ///////////////////////////
    function addSellOffer(uint _amount, uint _priceInWei, address _who, Data.Token storage token) private {
        Data.OrderBook storage sellBookAtOfferedPrice = token.sellBook[_priceInWei];
        Data.Offer[] storage offersAtPrice = sellBookAtOfferedPrice.offers;

        offersAtPrice.push(Data.Offer(_amount, _who));

        if (offersAtPrice.length == 1) {
            //we have a new sell order - increase the counter, so we can set the getOrderBook array later
            token.amountSellPrices = token.amountSellPrices.add(1);

            //lowerPrice and higherPrice have to be set
            uint currentSellPrice = token.currentSellPrice;
            uint highestSellPrice = token.highestSellPrice;

            if (highestSellPrice == 0 || highestSellPrice < _priceInWei) {
                if (currentSellPrice == 0) {
                    //there is no sell order yet, we insert the first one...
                    token.currentSellPrice = _priceInWei;
                    sellBookAtOfferedPrice.higherPrice = 0;
                    sellBookAtOfferedPrice.lowerPrice = 0;
                }
                else {
                    //this is the highest sell order
                    token.sellBook[highestSellPrice].higherPrice = _priceInWei;
                    sellBookAtOfferedPrice.lowerPrice = highestSellPrice;
                    sellBookAtOfferedPrice.higherPrice = 0;
                }

                token.highestSellPrice = _priceInWei;

            }
            else if (currentSellPrice > _priceInWei) {
                //the offer to sell is the lowest one, we don't need to find the right spot
                token.sellBook[currentSellPrice].lowerPrice = _priceInWei;
                sellBookAtOfferedPrice.higherPrice = currentSellPrice;
                sellBookAtOfferedPrice.lowerPrice = 0;
                token.currentSellPrice = _priceInWei;

            }
            else {
                //we are somewhere in the middle, we need to find the right spot first...
                uint sellPrice = token.currentSellPrice;
                bool isSpotFound = false;

                while (sellPrice > 0 && !isSpotFound) {
                    if (sellPrice < _priceInWei && token.sellBook[sellPrice].higherPrice > _priceInWei) {
                        //set the new order-book entry higher/lowerPrice first right
                        sellBookAtOfferedPrice.lowerPrice = sellPrice;
                        sellBookAtOfferedPrice.higherPrice = token.sellBook[sellPrice].higherPrice;

                        //set the higherPrice'd order-book entries lowerPrice to the current Price
                        token.sellBook[token.sellBook[sellPrice].higherPrice].lowerPrice = _priceInWei;
                        //set the lowerPrice'd order-book entries higherPrice to the current Price
                        token.sellBook[sellPrice].higherPrice = _priceInWei;

                        //set we found it.
                        isSpotFound = true;
                    }
                    sellPrice = token.sellBook[sellPrice].higherPrice;
                }
            }
        }
    }

    //////////////////////////////
    // CANCEL LIMIT ORDER LOGIC //
    //////////////////////////////
    function cancelOrder(
        bool _isSellOrder,
        uint _priceInWei,
        uint _offerKey,
        Data.Token storage token,
        Data.Balance storage tokenBalance
    ) internal {
        if (_isSellOrder) {
            Data.Offer storage sellOffer = token.sellBook[_priceInWei].offers[_offerKey];
            require(sellOffer.who == msg.sender);

            tokenBalance.value = tokenBalance.value.add(sellOffer.amount);
            sellOffer.amount = 0;
            emit SellOrderCanceled(token.name, _priceInWei, _offerKey);
        }
        else {
            Data.Offer storage buyOffer = token.buyBook[_priceInWei].offers[_offerKey];
            require(buyOffer.who == msg.sender);

            tokenBalance.value = tokenBalance.value.add(buyOffer.amount.mul(_priceInWei));
            buyOffer.amount = 0;
            emit BuyOrderCanceled(token.name, _priceInWei, _offerKey);
        }
    }
}
