import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LaneProvider } from './context/LaneContext';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <LaneProvider>
        <App />
      </LaneProvider>
    </AuthProvider>
  </React.StrictMode>
);
