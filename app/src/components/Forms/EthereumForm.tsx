import * as React from 'react';

import { Card } from 'antd';
import { object } from 'prop-types';

import DepositWithdrawForm from './DepositWithdrawForm';

export default class EthereumForm extends React.Component<any> {
  public static contextTypes = {
    drizzle: object
  };

  public constructor(props: any, context: any) {
    super(props);
    this.drizzle = context.drizzle;
  }

  private drizzle: any;

  private fetchEthBalance = () => {
    this.drizzle.contracts.Exchange.methods.ethBalancesInWei.cacheCall(
      this.props.accounts[0]
    );
  };

  public componentDidUpdate() {
    if (
      Object.keys(this.props.Exchange.ethBalancesInWei).length === 0 &&
      this.props.drizzleStatus.initialized
    ) {
      this.fetchEthBalance();
    }
  }

  public render() {
    const { web3 } = this.drizzle;
    const ethBalanceInWei: any = Object.values(
      this.props.Exchange.ethBalancesInWei
    )[0];

    const ethBalance: any = ethBalanceInWei
      ? web3.utils.fromWei(ethBalanceInWei.value, 'ether')
      : 0;

    return (
      <React.Fragment>
        <Card>
          <h4 style={{ marginTop: '-10px', marginBottom: '10px' }}>
            Your ETH Balance: {ethBalance}
          </h4>
          <DepositWithdrawForm
            type="ethereum"
            account={this.props.accounts[0]}
          />
        </Card>
      </React.Fragment>
    );
  }
}
