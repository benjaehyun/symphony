import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Routes from './Routes'; 
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/error/ErrorFallback';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Router>
            <Layout>
              <Routes />
            </Layout>
          </Router>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

export default App;