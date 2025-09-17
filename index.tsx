import ReactDOM from 'react-dom/client';
import App from './App';

import './styles.css';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { LiveClientOptions } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const apiOptions: LiveClientOptions = {
  apiKey: process.env.API_KEY || '',
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <LiveAPIProvider options={apiOptions}>
    <App />
  </LiveAPIProvider>
);
