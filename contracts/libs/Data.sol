pragma solidity ^0.4.24;

library Data {
    ///////////////////////
    // GENERAL STRUCTURE //
    ///////////////////////
    struct Offer {
        uint amount;
        address who;
    }

    struct OrderBook {
        uint higherPrice;
        uint lowerPrice;

        Offer[] offers;
    }

    struct Token {
        address contractAddress;
        bytes16 name;

        mapping (uint => OrderBook) buyBook;

        uint currentBuyPrice;
        uint lowestBuyPrice;
        uint amountBuyPrices;

        mapping (uint => OrderBook) sellBook;
        uint currentSellPrice;
        uint highestSellPrice;
        uint amountSellPrices;
    }
    

    //////////////
    // BALANCES //
    //////////////
    struct Balance {
        uint value;
    }
}
