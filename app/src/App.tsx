import * as React from 'react';

import { Card, Collapse, Layout, Menu } from 'antd';
import { drizzleConnect } from 'drizzle-react';
import { object } from 'prop-types';

import './App.css';
import ExchangeOverview from './components/ExchangeOverview';
import { EthereumForm, NewTokenForm } from './components/Forms';

interface IDrizzleState {
  accounts: string[];
  contracts: {
    Exchange: object;
    FixedSupplyToken: object;
  };
  drizzleStatus: {
    initialized: boolean;
  };
}

interface IAppProps {
  form: any;
  accounts: string[];
  Exchange: {
    getEthBalanceInWei: any;
    getTokenNames: any;
    tokenBalances: any;
    getSellOrderBook: any;
    getBuyOrderBook: any;
  };
  FixedSupplyToken: any;
  drizzleStatus: {
    initialized: boolean;
  };
}

interface IAppState {
  currentPage: string;
  activeToken: string;
  tokenNames: any;
}

const mapStateToProps = (state: IDrizzleState) => {
  return {
    Exchange: state.contracts.Exchange,
    FixedSupplyToken: state.contracts.FixedSupplyToken,
    accounts: state.accounts,
    drizzleStatus: state.drizzleStatus
  };
};

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

class App extends React.Component<IAppProps, IAppState> {
  public static contextTypes = {
    drizzle: object
  };

  public constructor(props: any, context: any) {
    super(props);
    this.drizzle = context.drizzle;
    this.state = {
      activeToken: '',
      currentPage: 'exchangeOverview',
      tokenNames: null
    };
  }

  private drizzle: any;

  private selectActiveToken = (e: any) => {
    this.setState({
      activeToken: e.item.props.children
    });
  };

  public render() {
    global.console.log(this.props, this.context);
    const { value: tokenNames = {} } =
      this.props.Exchange.getTokenNames['0x0'] || {};

    return (
      <Layout className="layout">
        <Header className="header">
          <span className="logo">
            <h1 style={{ color: 'white' }}>Distributed Token Exchange</h1>
          </span>
        </Header>
        <Layout>
          <Sider width={320} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['Ethereum']}
              defaultOpenKeys={['ethereum', 'activeToken']}
              theme="dark"
            >
              <SubMenu key="ethereum" title="Ethereum">
                <EthereumForm
                  Exchange={this.props.Exchange}
                  accounts={this.props.accounts}
                  drizzleStatus={this.props.drizzleStatus}
                />
              </SubMenu>
              <SubMenu key="activeToken" title="Select Token">
                {(tokenNames.length > 0 &&
                  tokenNames.map((tokenName: any) => (
                    <Menu.Item key={tokenName} onClick={this.selectActiveToken}>
                      {this.drizzle.web3.utils.hexToString(tokenName)}
                    </Menu.Item>
                  ))) || (
                  <React.Fragment>
                    <Card>No Tokens available</Card>
                  </React.Fragment>
                )}
              </SubMenu>
            </Menu>
            <Collapse>
              <Collapse.Panel header="Add Token to Exchange" key="1">
                <NewTokenForm />
              </Collapse.Panel>
            </Collapse>
          </Sider>
          <Layout>
            <Content style={{ padding: '30px 50px' }}>
              {this.props.drizzleStatus.initialized && (
                <ExchangeOverview
                  activeToken={this.state.activeToken}
                  allowance={this.props.FixedSupplyToken.allowance}
                  tokenBalances={this.props.Exchange.tokenBalances}
                  senderAddress={this.props.accounts[0]}
                  sellOrderBook={this.props.Exchange.getSellOrderBook}
                  buyOrderBook={this.props.Exchange.getBuyOrderBook}
                />
              )}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default drizzleConnect(App, mapStateToProps);
