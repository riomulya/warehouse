import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App';

const container = document.getElementById('app');
if (!container) throw new Error('Root container #app tidak ditemukan.');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
