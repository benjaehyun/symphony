import { BrowserRouter as Router } from 'react-router-dom';
import Routes from './Routes'; 
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/error/ErrorFallback';

function App() {
  const handleError = (error, info) => {
    // Log to your error reporting service
    console.error('Application Error:', error, info);
  };

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onError={handleError}
          onReset={() => {
            // Reset application state if needed
            window.location.reload();
          }}
        >
          <Router>
            <Routes />
          </Router>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

export default App;