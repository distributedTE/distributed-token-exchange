import * as React from 'react';

import { Button, Table } from 'antd';
import { object } from 'prop-types';

export default class OrderBook extends React.Component<any> {
  public static contextTypes = {
    drizzle: object
  };

  public constructor(props: any, context: any) {
    super(props);
    this.drizzle = context.drizzle;
  }

  private drizzle: any;

  private columns = [
    {
      title: 'Order Book',
      children: [
        {
          title: 'Market Size',
          dataIndex: 'marketSize',
          key: 'marketSize',
          width: 60
        },
        {
          title: 'Price',
          dataIndex: 'price',
          key: 'price',
          width: 60
        },
        {
          title: 'My Size',
          dataIndex: 'mySize',
          key: 'mySize',
          width: 60
        },
        {
          title: 'Action',
          dataIndex: 'cancel',
          key: 'cancel',
          width: 40,
          render: (text: any, record: any) => {
            return text === 'Cancel' ? (
              // tslint:disable-next-line
              <Button onClick={() => this.cancelOrder(record)} type="danger">
                Cancel
              </Button>
            ) : (
              ''
            );
          }
        }
      ]
    }
  ];

  private cancelOrder = (record: any) => {
    const { contracts, web3 } = this.drizzle;

    global.console.log(record);
    contracts.Exchange.methods.cancelOrder.cacheSend(
      web3.utils.asciiToHex(this.props.activeToken),
      record.isSellPrice,
      record.price,
      record.myOfferKey
    );
  };

  private getRowClassName = (record: any, id: any) => {
    return id < this.props.sellOrderBook[0].length ? 'sellRow' : 'buyRow';
  };

  public render() {
    const { sellOrderBook = [], buyOrderBook = [] } = this.props;

    const [
      sellPrices,
      sellVolumes,
      mySellVolumes,
      mySellOfferKeys
    ] = sellOrderBook;
    const sellData = sellPrices
      ? sellPrices.reduce((acc: any, sellPrice: any, id: any) => {
          acc.unshift({
            isSellPrice: true,
            marketSize: sellVolumes[id],
            price: sellPrice,
            mySize: mySellVolumes[id] !== '0' ? mySellVolumes[id] : '-',
            myOfferKey: mySellOfferKeys[id],
            cancel: mySellVolumes[id] !== '0' ? 'Cancel' : ''
          });
          return acc;
        }, [])
      : [];

    const [buyPrices, buyVolumes, myBuyVolumes, myBuyOfferKeys] = buyOrderBook;
    const buyData = buyPrices
      ? buyPrices.reduce((acc: any, buyPrice: any, id: any) => {
          acc.unshift({
            marketSize: buyVolumes[id],
            price: buyPrice,
            mySize: myBuyVolumes[id] !== '0' ? myBuyVolumes[id] : '-',
            myOfferKey: myBuyOfferKeys[id],
            cancel: myBuyVolumes[id] !== '0' ? 'Cancel' : ''
          });
          return acc;
        }, [])
      : [];

    return (
      <Table
        columns={this.columns}
        dataSource={sellData.concat(buyData)}
        bordered={true}
        rowClassName={this.getRowClassName}
        pagination={false}
        size="small"
        className="order-book-table"
      />
    );
  }
}
