import * as React from 'react';

import { Button, Card, Form, Input } from 'antd';
import { object } from 'prop-types';

import { validateIfGreaterThanZero } from '../../helpers';

export default Form.create()(
  class TokenForm extends React.Component<any> {
    public static contextTypes = {
      drizzle: object
    };

    public constructor(props: any, context: any) {
      super(props);
      this.drizzle = context.drizzle;
    }

    private drizzle: any;

    private sellBuyToken = (e: any) => {
      this.props.form.validateFields((err: any, values: any) => {
        if (!err) {
          const { amount, priceInWei } = values;
          const { contracts, web3 } = this.drizzle;

          contracts.Exchange.methods[e.target.id + 'Token'].cacheSend(
            web3.utils.asciiToHex(this.props.activeToken),
            amount,
            priceInWei
          );
        }
      });
    };

    public render() {
      const { getFieldDecorator } = this.props.form;

      return (
        <React.Fragment>
          <Card
            title="Trade Token"
            style={{ marginLeft: '30px', width: '260px' }}
            bodyStyle={{ padding: '10px 24px' }}
            actions={[
              <Button
                key="buyToken"
                id="buy"
                className="greenButton"
                onClick={this.sellBuyToken}
              >
                Buy
              </Button>,
              <Button
                key="sellToken"
                id="sell"
                type="danger"
                onClick={this.sellBuyToken}
              >
                Sell
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
              <Form.Item className="formItem">
                {getFieldDecorator('priceInWei', {
                  rules: [
                    {
                      required: true,
                      message: 'Input your Price in Wei.'
                    },
                    {
                      validator: validateIfGreaterThanZero,
                      message: 'Price In Wei has to be greater than 0.'
                    }
                  ]
                })(<Input placeholder="Price in Wei" />)}
              </Form.Item>
            </Form>
          </Card>
        </React.Fragment>
      );
    }
  }
);
