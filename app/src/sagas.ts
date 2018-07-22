import { drizzleSagas } from 'drizzle';
import { all, fork, take } from 'redux-saga/effects';

function* fetchInitialTokenNames(drizzle: any) {
  yield take('DRIZZLE_INITIALIZED');
  drizzle.contracts.Exchange.methods.getTokenNames.cacheCall();
}

function* handleAddTokenAction(drizzle: any) {
  let action;
  while (true) {
    action = yield take('SEND_CONTRACT_TX');

    if (action.fnName === 'addToken') {
      action = yield take(['TX_SUCCESSFUL', 'TX_ERROR']);
      if (action.type === 'TX_SUCCESSFUL') {
        drizzle.contracts.Exchange.methods.getTokenNames.cacheCall();
      }
    }
  }
}

export default function* root(drizzle: any) {
  yield all([
    fork(fetchInitialTokenNames, drizzle),
    fork(handleAddTokenAction, drizzle),
    ...drizzleSagas.map((saga: any) => fork(saga))
  ]);
}
