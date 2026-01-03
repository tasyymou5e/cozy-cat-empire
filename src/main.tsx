import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: Entry point reached
console.log('[INIT] main.tsx: Script loaded');

const rootElement = document.getElementById("root");
console.log('[INIT] main.tsx: Root element found:', !!rootElement);

if (!rootElement) {
  console.error('[INIT] main.tsx: FATAL - No root element found!');
} else {
  console.log('[INIT] main.tsx: Creating React root...');
  const root = createRoot(rootElement);
  console.log('[INIT] main.tsx: Rendering App component...');
  root.render(<App />);
  console.log('[INIT] main.tsx: render() called');
}
