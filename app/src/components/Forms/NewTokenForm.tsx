import * as React from 'react';

import { Button, Card, Form, Input } from 'antd';
import { object } from 'prop-types';

export default Form.create()(
  class WrappedComponent extends React.Component<any, any> {
    public static contextTypes = {
      drizzle: object
    };

    public constructor(props: any, context: any) {
      super(props);
      this.drizzle = context.drizzle;
    }

    private drizzle: any;

    private handleSubmit = (e: any) => {
      e.preventDefault();
      this.props.form.validateFields((err: any, values: any) => {
        if (!err) {
          const { name, address, allowance } = values;
          const { store, contracts, web3 } = this.drizzle;

          const state = store.getState();

          if (state.drizzleStatus.initialized) {
            contracts.Exchange.methods.addToken.cacheSend(
              web3.utils.asciiToHex(name),
              address
            );

            this.props.form.resetFields();
          }
        }
      });
    };

    public render() {
      const { getFieldDecorator } = this.props.form;

      return (
        <Card
          bodyStyle={{ padding: '10px 24px' }}
          actions={[
            <Button
              key="addToken"
              className="greenButton"
              onClick={this.handleSubmit}
            >
              Add Token
            </Button>
          ]}
        >
          <Form>
            <Form.Item className="formItem">
              {getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message: 'Input Token Name.'
                  },
                  {
                    max: 16,
                    message: 'Token Name can contain max 16 characters'
                  }
                ]
              })(<Input placeholder="Name" />)}
            </Form.Item>
            <Form.Item className="formItem">
              {getFieldDecorator('address', {
                rules: [
                  {
                    required: true,
                    message: 'Input Token Address.'
                  },
                  {
                    pattern: /^0x[a-zA-Z0-9]{40}$/,
                    message: 'Provide valid Token Address.'
                  }
                ]
              })(<Input placeholder="Address" />)}
            </Form.Item>
          </Form>
        </Card>
      );
    }
  }
);
