import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LaneProvider } from './context/LaneContext';
import { AuthProvider } from './context/AuthContext';
import { LaneSettingsProvider } from './context/LaneSettingsContext';
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <LaneSettingsProvider>
        <LaneProvider>
          <App />
        </LaneProvider>
      </LaneSettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
