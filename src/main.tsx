import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for caching and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
        
        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(error => {
        // Gracefully handle SW registration failure (common in dev/preview environments)
        // Don't treat as fatal - app works fine without SW
        console.warn('ServiceWorker registration skipped:', error.message || error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
