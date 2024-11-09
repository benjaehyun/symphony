import { BrowserRouter as Router } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Routes from './Routes'; // We'll create this next

function App() {
  return (
    <Router>
      <Layout>
        <Routes />
      </Layout>
    </Router>
  );
}

export default App;