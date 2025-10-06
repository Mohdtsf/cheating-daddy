export async function resizeLayout() {
    try {
        // Prefer the secure preload bridge when present
        if (window?.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
            const result = await window.electron.ipcRenderer.invoke('update-sizes');
            if (result?.success) {
                console.log('Window resized for current view');
            } else {
                console.error('Failed to resize window:', result?.error);
            }
            return;
        }

        // Fallback for legacy/nodeIntegration environments
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            const result = await ipcRenderer.invoke('update-sizes');
            if (result.success) {
                console.log('Window resized for current view');
            } else {
                console.error('Failed to resize window:', result.error);
            }
        }
    } catch (error) {
        console.error('Error resizing window:', error);
    }
}
