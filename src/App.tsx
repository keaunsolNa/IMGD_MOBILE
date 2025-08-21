import React, { useEffect } from 'react';
import RootNavigator from './navigation/RootNavigator';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { setAuth } from './redux/authSlice';
import { getAccessToken } from './services/storage';

function AuthBootstrap() {
  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        // token은 순수 문자열(예: 'eyJ...'), 헤더에서는 'Bearer ' 접두어로 붙여서 사용
        store.dispatch(setAuth({ accessToken: token }));
      }
    })();
  }, []);
  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      <RootNavigator />
    </Provider>
  );
}
