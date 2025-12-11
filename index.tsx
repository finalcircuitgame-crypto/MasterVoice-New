import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ModalProvider } from './components/ModalContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode can cause double-invoke of effects, handled in WebRTC logic via refs
  <React.StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </React.StrictMode>
);