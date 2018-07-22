import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';

import { drizzleReducers, generateContractsInitialState } from 'drizzle';
import { DrizzleProvider } from 'drizzle-react';

import App from './App';
import DrizzleSagaConnector from './DrizzleSagaConnector';
import registerServiceWorker from './registerServiceWorker';
import rootSaga from './sagas';

import Exchange from 'distributed-token-exchange/build/contracts/Exchange.json';
import FixedSupplyToken from 'distributed-token-exchange/build/contracts/FixedSupplyToken.json';

const options = {
  contracts: [Exchange, FixedSupplyToken]
};

const initialState = {
  contracts: generateContractsInitialState(options)
};

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  combineReducers({ ...drizzleReducers }),
  initialState,
  composeWithDevTools({})(applyMiddleware(sagaMiddleware))
);

ReactDOM.render(
  <DrizzleProvider options={options} store={store}>
    <DrizzleSagaConnector sagaMiddleware={sagaMiddleware} rootSaga={rootSaga}>
      <App />
    </DrizzleSagaConnector>
  </DrizzleProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
