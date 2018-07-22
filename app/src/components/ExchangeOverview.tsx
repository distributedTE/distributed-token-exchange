import * as React from 'react';

import { Col, Form, Row } from 'antd';
import { object } from 'prop-types';

import { DepositWithdrawForm, TradeTokenForm } from './Forms';
import OrderBook from './OrderBook';

interface IProps {
  activeToken: string;
  allowance: any;
  form: any;
  tokenBalances: any;
  senderAddress: any;
  sellOrderBook: any;
  buyOrderBook: any;
}

interface IState {
  tokenBalanceIds: any;
}

class ExchangeOverview extends React.Component<IProps, IState> {
  public static contextTypes = {
    drizzle: object
  };

  public constructor(props: any, context: any) {
    super(props);
    this.drizzle = context.drizzle;
    this.state = {
      tokenBalanceIds: new Map()
    };
  }

  private drizzle: any;

  private getBuyOrderBook = () => {
    const buyOrderBook = this.props.buyOrderBook[
      Object.keys(this.props.buyOrderBook)[0]
    ];
    return buyOrderBook ? buyOrderBook.value : '';
  };

  private getSellOrderBook = () => {
    const sellOrderBook = this.props.sellOrderBook[
      Object.keys(this.props.sellOrderBook)[0]
    ];
    return sellOrderBook ? sellOrderBook.value : '';
  };

  private getTokenAllowanceForExchange = () => {
    const allowance = this.props.allowance[
      Object.keys(this.props.allowance)[0]
    ];
    return allowance ? allowance.value : '';
  };

  private getTokenBalanceInExchange = () => {
    const txHash = this.state.tokenBalanceIds.get(this.props.activeToken);
    const tokenBalance = this.props.tokenBalances[txHash];
    return tokenBalance ? tokenBalance.value : '';
  };

  private fetchBuyOrderBook = () => {
    const { contracts, web3 } = this.drizzle;

    const stackId = contracts.Exchange.methods.getBuyOrderBook.cacheCall(
      web3.utils.asciiToHex(this.props.activeToken)
    );
  };

  private fetchSellOrderBook = () => {
    const { contracts, web3 } = this.drizzle;

    const stackId = contracts.Exchange.methods.getSellOrderBook.cacheCall(
      web3.utils.asciiToHex(this.props.activeToken)
    );
  };

  private fetchTokenAllowanceForExchange = () => {
    const {
      contracts: { Exchange, FixedSupplyToken }
    } = this.drizzle;

    FixedSupplyToken.methods.allowance.cacheCall(
      this.props.senderAddress,
      Exchange.address
    );
  };

  private fetchTokenBalanceInAccount = () => {
    this.drizzle.contracts.FixedSupplyToken.methods.balanceOf.cacheCall(
      this.props.senderAddress
    );
  };

  private fetchTokenBalanceInExchange = () => {
    const { contracts, web3 } = this.drizzle;

    const stackId = contracts.Exchange.methods.tokenBalances.cacheCall(
      this.props.senderAddress,
      web3.utils.asciiToHex(this.props.activeToken)
    );

    this.setState({
      tokenBalanceIds: this.state.tokenBalanceIds.set(
        this.props.activeToken,
        stackId
      )
    });
  };

  private handleSubmit = (e: any) => {
    e.preventDefault();
    this.props.form.validateFields((err: any, values: any) => {
      if (!err) {
        global.console.log('Received values of form: ', values);
      }
    });
  };

  public componentDidUpdate(prevProps: any) {
    if (this.props.activeToken !== prevProps.activeToken) {
      this.fetchTokenBalanceInExchange();
      this.fetchSellOrderBook();
      this.fetchBuyOrderBook();
      this.fetchTokenAllowanceForExchange();
      this.fetchTokenBalanceInAccount();
    }
  }

  public render() {
    return (
      <React.Fragment>
        <Row
          style={{
            width: '800px',
            marginBottom: '60px'
          }}
        >
          <Col span={7}>
            <h2>
              {this.props.activeToken
                ? `Token: ${this.props.activeToken}`
                : 'Select Token to show Order Book'}
            </h2>
            {this.props.activeToken && (
              <h3>Your Token Balance: {this.getTokenBalanceInExchange()}</h3>
            )}
          </Col>
          <Col span={12}>
            {this.props.activeToken && (
              <DepositWithdrawForm
                account={this.props.senderAddress}
                activeToken={this.props.activeToken}
                allowance={this.getTokenAllowanceForExchange()}
                title="Manage Token Balance"
              />
            )}
          </Col>
        </Row>
        {this.props.activeToken && (
          <Row
            style={{
              width: '800px'
            }}
          >
            <Col span={12}>
              <OrderBook
                activeToken={this.props.activeToken}
                sellOrderBook={this.getSellOrderBook()}
                buyOrderBook={this.getBuyOrderBook()}
              />
            </Col>
            <Col span={12}>
              <TradeTokenForm
                account={this.props.senderAddress}
                activeToken={this.props.activeToken}
              />
            </Col>
          </Row>
        )}
      </React.Fragment>
    );
  }
}

export default Form.create()(ExchangeOverview);
