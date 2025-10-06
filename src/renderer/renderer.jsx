import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// If running inside Electron (nodeIntegration enabled), load legacy renderer shim
try {
    if (window && window.require) {
        // eslint-disable-next-line global-require
        window.require('../utils/renderer.js');
    }
} catch (e) {
    // Not running in Electron or module not available during dev -- ignore
}
