import React from 'react'  // React library import
import ReactDOM from 'react-dom/client'  // React library import
import App from './App.jsx'
import './index.css'
import './theme-override.css'
import { BrowserRouter } from "react-router-dom";  // React library import
import { ToastProvider } from './toast/Context.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

  // Register service worker for offline functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        if (import.meta.env.DEV) {
          console.log('SW registered: ', registration);
        }
      })
      .catch((registrationError) => {
        if (import.meta.env.DEV) {
          console.log('SW registration failed: ', registrationError);
        }
      });
  });
}
