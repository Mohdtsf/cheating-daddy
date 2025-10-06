import React, { useEffect, useState } from 'react';

export default function AdvancedView() {
    const [contentProtection, setContentProtection] = useState(() => {
        const v = localStorage.getItem('contentProtection');
        return v === null ? true : v === 'true';
    });

    const [throttleTokens, setThrottleTokens] = useState(() => {
        const v = localStorage.getItem('throttleTokens');
        return v === null ? true : v === 'true';
    });
    const [maxTokensPerMin, setMaxTokensPerMin] = useState(() => parseInt(localStorage.getItem('maxTokensPerMin') || '1000000', 10));
    const [throttleAtPercent, setThrottleAtPercent] = useState(() => parseInt(localStorage.getItem('throttleAtPercent') || '75', 10));

    const [isClearing, setIsClearing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState(''); // 'success' | 'error'

    useEffect(() => {
        localStorage.setItem('contentProtection', String(contentProtection));
        // notify main process via the secure preload bridge if available
        try {
            try {
                if (window?.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
                    window.electron.ipcRenderer.invoke('update-content-protection', contentProtection).catch(() => { });
                } else if (window?.require) {
                    try {
                        const { ipcRenderer } = window.require('electron');
                        ipcRenderer.invoke('update-content-protection', contentProtection).catch(() => { });
                    } catch (e) { }
                } else if (window?.cheddar?.updateContentProtection) {
                    try { window.cheddar.updateContentProtection(contentProtection); } catch (e) { }
                }
            } catch (e) {
                // best-effort
            }
        } catch (e) {
            // best-effort
        }
    }, [contentProtection]);

    useEffect(() => {
        localStorage.setItem('throttleTokens', String(throttleTokens));
    }, [throttleTokens]);

    useEffect(() => {
        localStorage.setItem('maxTokensPerMin', String(maxTokensPerMin));
    }, [maxTokensPerMin]);

    useEffect(() => {
        localStorage.setItem('throttleAtPercent', String(throttleAtPercent));
    }, [throttleAtPercent]);

    function resetRateLimitSettings() {
        setThrottleTokens(true);
        setMaxTokensPerMin(1000000);
        setThrottleAtPercent(75);
        localStorage.removeItem('throttleTokens');
        localStorage.removeItem('maxTokensPerMin');
        localStorage.removeItem('throttleAtPercent');
    }

    async function clearLocalData() {
        if (isClearing) return;

        const ok = window.confirm('This will clear all local data (localStorage, sessionStorage, IndexedDB, caches) and close the app. Continue?');
        if (!ok) return;

        setIsClearing(true);
        setStatusMessage('');
        setStatusType('');

        try {
            // Clear localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();

            // Attempt to delete all IndexedDB databases (best-effort)
            if (indexedDB && indexedDB.databases) {
                try {
                    const dbs = await indexedDB.databases();
                    const promises = dbs.map(db => new Promise((resolve) => {
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = () => resolve();
                        req.onerror = () => resolve();
                        req.onblocked = () => resolve();
                    }));
                    await Promise.all(promises);
                    setStatusMessage(`✅ Successfully cleared local data (removed ${dbs.length} IndexedDB databases).`);
                    setStatusType('success');
                } catch (e) {
                    console.warn('indexedDB.databases failed', e);
                }
            } else if (indexedDB) {
                // Fallback: try deleting a few known names if available (best-effort)
                try {
                    // No reliable way to enumerate in older browsers from here — skip.
                } catch (e) { }
            }

            // Clear caches if available
            if ('caches' in window) {
                try {
                    const names = await caches.keys();
                    await Promise.all(names.map(n => caches.delete(n)));
                } catch (e) {
                    console.warn('cache clear failed', e);
                }
            }

            // Short delay and then attempt to quit the app via IPC
            setTimeout(async () => {
                setStatusMessage('🔄 Closing application...');
                try {
                    if (window?.require) {
                        try {
                            const { ipcRenderer } = window.require('electron');
                            await ipcRenderer.invoke('quit-application');
                        } catch (e) { }
                    } else if (window?.cheddar?.quitApplication) {
                        try { await window.cheddar.quitApplication(); } catch (e) { }
                    }
                } catch (e) {
                    console.warn('quit failed', e);
                }
            }, 1200);

        } catch (error) {
            console.error('Error clearing data:', error);
            setStatusMessage(`❌ Error clearing data: ${error?.message || String(error)}`);
            setStatusType('error');
        } finally {
            setIsClearing(false);
        }
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-2">Advanced Tools</h2>
            <p className="text-sm text-gray-400 mb-6">Advanced utilities and debug tools.</p>

            <div className="grid gap-6">
                <section className="p-4 rounded-lg border border-[var(--card-border,rgba(255,255,255,0.08))] bg-[var(--card-background,rgba(255,255,255,0.02))]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Content Protection</h3>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">Content protection makes the application window invisible to screen sharing and recording software. Use with caution.</p>

                    <div className="flex items-start gap-3">
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={contentProtection} onChange={(e) => setContentProtection(e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Enable content protection (stealth mode)</span>
                        </label>
                    </div>

                    <div className="text-xs text-gray-400 mt-3">{contentProtection ? 'The application is currently invisible to screen sharing and recording software.' : 'The application is currently visible to screen sharing and recording software.'}</div>
                </section>

                <section className="p-4 rounded-lg border border-[var(--card-border,rgba(255,255,255,0.08))] bg-[var(--card-background,rgba(255,255,255,0.02))]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Rate Limiting</h3>
                    </div>

                    <div className="mb-3 p-3 rounded bg-[var(--warning-background,rgba(251,191,36,0.06))] border border-[var(--warning-border,rgba(251,191,36,0.12))] text-sm text-[var(--warning-color,#f59e0b)]">
                        <strong>Warning:</strong> Don't change these unless you understand the consequences. Incorrect limits may cause the app to stop working or hit API limits.
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Throttle tokens</label>
                            <label className="inline-flex items-center gap-2">
                                <input type="checkbox" checked={throttleTokens} onChange={(e) => setThrottleTokens(e.target.checked)} className="w-4 h-4" />
                                <span className="text-sm text-gray-300">Enable throttling when near limits</span>
                            </label>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Max Allowed Tokens Per Minute</label>
                            <input type="number" min="1000" max="10000000" step="1000" value={maxTokensPerMin} onChange={(e) => setMaxTokensPerMin(Math.max(1000, parseInt(e.target.value || '1000', 10)))} className="form-input px-3 py-2 rounded bg-[var(--input-background)] border border-[var(--input-border)] text-sm" />
                            <div className="text-xs text-gray-400">Maximum tokens per minute before throttling</div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Throttle At Percent</label>
                            <input type="number" min="1" max="99" step="1" value={throttleAtPercent} onChange={(e) => setThrottleAtPercent(Math.min(99, Math.max(1, parseInt(e.target.value || '75', 10))))} className="form-input px-3 py-2 rounded bg-[var(--input-background)] border border-[var(--input-border)] text-sm" />
                            <div className="text-xs text-gray-400">Start throttling at this percent of the limit ({throttleAtPercent}% = {Math.floor((maxTokensPerMin * throttleAtPercent) / 100)} tokens)</div>
                        </div>

                        <div className="flex items-start">
                            <div>
                                <button onClick={resetRateLimitSettings} className="px-3 py-2 rounded bg-[var(--button-background,rgba(255,255,255,0.06))] border border-[var(--button-border)] text-sm">Reset to Defaults</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="p-4 rounded-lg border border-[var(--card-border,rgba(255,255,255,0.08))] bg-[var(--danger-background,rgba(239,68,68,0.04))]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Data Management</h3>
                    </div>

                    <div className="mb-3 p-3 rounded bg-[var(--danger-background,rgba(239,68,68,0.06))] border border-[var(--danger-border,rgba(239,68,68,0.1))] text-sm text-red-400">
                        <strong>Important:</strong> This will permanently delete all local data and cannot be undone.
                    </div>

                    <div className="flex items-start gap-4">
                        <button disabled={isClearing} onClick={clearLocalData} className="px-4 py-2 rounded bg-red-600 text-white text-sm disabled:opacity-50">
                            {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Local Data'}
                        </button>

                        {statusMessage ? (
                            <div className={`px-3 py-2 rounded text-sm ${statusType === 'success' ? 'bg-[var(--success-background,rgba(34,197,94,0.08))] text-green-400 border border-[var(--success-border,rgba(34,197,94,0.12))]' : 'bg-[var(--danger-background,rgba(239,68,68,0.06))] text-red-400 border border-[var(--danger-border,rgba(239,68,68,0.08))]'}`}>
                                {statusMessage}
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>
        </div>
    );
}
