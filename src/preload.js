// Secure preload script: expose a minimal, safe IPC surface to the renderer.
// This keeps the renderer free of direct Node access while allowing the
// renderer to call the main process via a controlled bridge.
// See: https://www.electronjs.org/docs/latest/tutorial/context-isolation

const { contextBridge, ipcRenderer } = require('electron');

// Helper to wrap ipcRenderer.on so the renderer keeps the existing handler
// signature (event, ...args). We don't expose the real `event`, but we pass
// `null` as the first argument so handlers that expect (event, payload)
// continue to work. We also keep a mapping so removeListener can unregister
// wrapped listeners correctly.
const listenerMap = new Map(); // channel -> Map(original -> wrapped)

function on(channel, listener) {
    let m = listenerMap.get(channel);
    if (!m) {
        m = new Map();
        listenerMap.set(channel, m);
    }
    const wrapped = (_event, ...args) => {
        try {
            listener(null, ...args);
        } catch (e) {
            console.error('Error in renderer listener for', channel, e);
        }
    };
    m.set(listener, wrapped);
    ipcRenderer.on(channel, wrapped);
    return () => {
        const w = m.get(listener);
        if (w) ipcRenderer.removeListener(channel, w);
        m.delete(listener);
    };
}

function removeListener(channel, listener) {
    const m = listenerMap.get(channel);
    if (!m) return;
    const wrapped = m.get(listener);
    if (wrapped) {
        ipcRenderer.removeListener(channel, wrapped);
        m.delete(listener);
    }
}

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, listener) => on(channel, listener),
        removeListener: (channel, listener) => removeListener(channel, listener),
        removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
    },
    // Expose platform helpers so renderer can make platform-specific decisions
    platform: process.platform,
    isMacOS: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
});
