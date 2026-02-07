import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LaneProvider } from './context/LaneContext';
import { AuthProvider } from './context/AuthContext';
import { LaneSettingsProvider } from './context/LaneSettingsContext';
import PitchPage from './pages/PitchPage';

/* Simple hash-based routing: #/pitch shows the landing page */
function Root() {
  const [route, setRoute] = React.useState(window.location.hash);

  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route === '#/pitch') {
    return <PitchPage />;
  }

  return (
    <AuthProvider>
      <LaneSettingsProvider>
        <LaneProvider>
          <App />
        </LaneProvider>
      </LaneSettingsProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
