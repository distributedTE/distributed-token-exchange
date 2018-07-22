import * as React from 'react';

import { Button, Card, Form, Icon, Input } from 'antd';
import { object } from 'prop-types';

import { validateIfGreaterThanZero } from '../../helpers';

export default Form.create()(
  class DepositForm extends React.Component<any> {
    public static contextTypes = {
      drizzle: object
    };

    public constructor(props: any, context: any) {
      super(props);
      this.drizzle = context.drizzle;
    }

    private drizzle: any;

    private decreaseApproval = async (
      FixedSupplyToken: any,
      exchangeAddress: any,
      amount: any
    ) => {
      await FixedSupplyToken.methods
        .decreaseApproval(exchangeAddress, amount)
        .send();
    };

    private increaseApproval = async (
      FixedSupplyToken: any,
      exchangeAddress: any,
      amount: any
    ) => {
      await FixedSupplyToken.methods[
        this.props.allowance === 0 ? 'approve' : 'increaseApproval'
      ](exchangeAddress, amount).send();
    };

    private depositWithdrawEthereum = (method: any, amount: any) => {
      const { contracts, web3 } = this.drizzle;

      const params =
        method === 'deposit'
          ? {
              value: web3.utils.toWei(amount, 'Ether'),
              from: this.props.account
            }
          : web3.utils.toWei(amount, 'Ether');
      contracts.Exchange.methods[method + 'Ether'].cacheSend(params);
    };

    private depositWithdrawToken = (method: any, amount: any) => {
      const { contracts, web3 } = this.drizzle;

      if (method === 'deposit') {
        this.increaseApproval(
          contracts.FixedSupplyToken,
          contracts.Exchange.address,
          amount
        );
      }

      contracts.Exchange.methods[method + 'Token'].cacheSend(
        web3.utils.asciiToHex(this.props.activeToken),
        amount
      );

      if (method === 'withdraw') {
        this.decreaseApproval(
          contracts.FixedSupplyToken,
          contracts.Exchange.address,
          amount
        );
      }
    };

    private handleSubmit = (e: any) => {
      e.preventDefault();
      this.props.form.validateFields(async (err: any, values: any) => {
        if (!err) {
          const method = e.target.id;
          const { amount } = values;

          if (this.props.type === 'ethereum') {
            this.depositWithdrawEthereum(method, amount);
          } else {
            this.depositWithdrawToken(method, amount);
          }
          this.props.form.resetFields();
        }
      });
    };

    public render() {
      const { getFieldDecorator } = this.props.form;

      return (
        <React.Fragment>
          <Card
            style={{ width: '270px' }}
            bodyStyle={{ padding: '10px 24px', flexGrow: 2 }}
            title={this.props.title}
            actions={[
              <Button
                id="deposit"
                key="deposit"
                className="greenButton"
                onClick={this.handleSubmit}
              >
                <Icon type="up-circle-o" />Deposit
              </Button>,
              <Button
                id="withdraw"
                key="withdraw"
                type="danger"
                onClick={this.handleSubmit}
              >
                <Icon type="down-circle-o" />Withdraw
              </Button>
            ]}
          >
            <Form>
              <Form.Item className="formItem">
                {getFieldDecorator('amount', {
                  rules: [
                    {
                      required: true,
                      message: 'Input your Amount.'
                    },
                    {
                      validator: validateIfGreaterThanZero,
                      message: 'Amount has to be greater than 0.'
                    }
                  ]
                })(<Input placeholder="Amount" />)}
              </Form.Item>
            </Form>
          </Card>
        </React.Fragment>
      );
    }
  }
);
