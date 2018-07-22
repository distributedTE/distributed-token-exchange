import * as React from 'react';

import { drizzleConnect } from 'drizzle-react';
import { object } from 'prop-types';

class DrizzleSagaConnector extends React.Component<any> {
  public static contextTypes = {
    drizzle: object
  };

  public constructor(props: any, context: any) {
    super(props);
    this.props.sagaMiddleware.run(this.props.rootSaga, context.drizzle);
  }

  public render() {
    return React.Children.only(this.props.children);
  }
}

export default drizzleConnect(DrizzleSagaConnector);
