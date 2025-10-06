import React, { useEffect, useRef, useState } from 'react';

export default function MainView({ onStart = () => { }, onAPIKeyHelp = () => { }, onLayoutModeChange = () => { } }) {
    const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
    const [isInitializing, setIsInitializing] = useState(false);
    const [showApiKeyError, setShowApiKeyError] = useState(false);
    const inputRef = useRef(null);
    const apiErrorTimeoutRef = useRef(null);

    useEffect(() => {
        // IPC listener from main process to update initializing state
        const handler = (event, initializing) => {
            setIsInitializing(Boolean(initializing));
        };

        try {
            window.electron?.ipcRenderer?.on('session-initializing', handler);
        } catch (e) {
            // noop
        }

        // keyboard shortcut: Ctrl+Enter (Windows/Linux) or Cmd+Enter (macOS)
        const keydown = (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isStartShortcut = isMac ? e.metaKey && e.key === 'Enter' : e.ctrlKey && e.key === 'Enter';
            if (isStartShortcut) {
                e.preventDefault();
                handleStartClick();
            }
        };
        document.addEventListener('keydown', keydown);

        // load saved layout mode (keeps original behavior)
        loadLayoutMode();

        // call optional resize helper if present on window (keeps parity with original)
        if (typeof window.resizeLayout === 'function') {
            try {
                window.resizeLayout();
            } catch (e) { }
        }

        return () => {
            try {
                window.electron?.ipcRenderer?.removeListener('session-initializing', handler);
            } catch (e) { }
            document.removeEventListener('keydown', keydown);
            if (apiErrorTimeoutRef.current) clearTimeout(apiErrorTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleInput(e) {
        const value = e.target.value;
        setApiKey(value);
        localStorage.setItem('apiKey', value);
        if (showApiKeyError) setShowApiKeyError(false);
    }

    function handleStartClick() {
        if (isInitializing) return;

        if (!apiKey || apiKey.trim() === '') {
            // Trigger visual error (blink) and keep focus on input
            triggerApiKeyError();
            inputRef.current?.focus();
            return;
        }

        // persist key and invoke callback
        localStorage.setItem('apiKey', apiKey.trim());
        onStart();
    }

    function handleAPIKeyHelpClick() {
        onAPIKeyHelp();
    }

    function handleResetOnboarding() {
        localStorage.removeItem('onboardingCompleted');
        window.location.reload();
    }

    function loadLayoutMode() {
        const savedLayoutMode = localStorage.getItem('layoutMode');
        if (savedLayoutMode && savedLayoutMode !== 'normal') {
            onLayoutModeChange(savedLayoutMode);
        }
    }

    function triggerApiKeyError() {
        setShowApiKeyError(true);
        if (apiErrorTimeoutRef.current) clearTimeout(apiErrorTimeoutRef.current);
        apiErrorTimeoutRef.current = setTimeout(() => setShowApiKeyError(false), 1000);
    }

    function StartButtonContent() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdIcon = (
            <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block ml-2">
                <path d="M9 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M15 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9H18C19.6569 9 21 7.65685 21 6C21 4.34315 19.6569 3 18 3C16.3431 3 15 4.34315 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M9 18C9 19.6569 7.65685 21 6 21C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
        );

        const enterIcon = (
            <svg width="14" height="14" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block ml-1">
                <path d="M10.25 19.25L6.75 15.75L10.25 12.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M6.75 15.75H12.75C14.9591 15.75 16.75 13.9591 16.75 11.75V4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
        );

        return (
            <>
                <span>Start Session</span>
                <span className="shortcut-icons ml-2 inline-flex items-center text-sm text-white">
                    {isMac ? (
                        <>
                            {cmdIcon}
                            {enterIcon}
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-medium mr-1 text-white">Ctrl</span>
                            {enterIcon}
                        </>
                    )}
                </span>
            </>
        );
    }

    return (
        <div className="w-full max-w-[900px] mx-auto h-full flex flex-col justify-center items-center p-4">
            {/* Local styles for the blink animation to match original */}
            <style>{`
                @keyframes blink-red { 0%,100%{border-color:transparent; background:transparent} 25%,75%{border-color:#ff4444; background:rgba(255,68,68,0.06)} 50%{border-color:#ff6666; background:rgba(255,68,68,0.09)} }
                .api-key-error { animation: blink-red 1s ease-in-out; border-color: #ff4444 !important; }
            `}</style>

            <div className="w-full max-w-md">
                <div className="text-3xl md:text-4xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Welcome
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 mb-6 w-full">
                    <input
                        ref={inputRef}
                        type="password"
                        placeholder="Enter your Gemini API Key"
                        value={apiKey}
                        onChange={handleInput}
                        className={`flex-1 rounded-xl p-4 text-base placeholder-gray-500 bg-gray-800/50 border border-gray-700/50 text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-200 ${showApiKeyError ? 'api-key-error' : ''}`}
                    />
                    <button
                        onClick={handleStartClick}
                        disabled={isInitializing}
                        className={`start-button inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold ${isInitializing ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl'} transition-all duration-200`}
                    >
                        <StartButtonContent />
                    </button>
                </div>

                <p className="text-sm md:text-base text-gray-400 mb-6">
                    Don’t have an API key?{' '}
                    <span onClick={handleAPIKeyHelpClick} className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors duration-200">
                        Get one here
                    </span>
                </p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleResetOnboarding}
                        className="text-sm text-gray-500 hover:text-gray-300 underline transition-colors duration-200"
                    >
                        Reset Onboarding
                    </button>
                </div>
            </div>
        </div>
    );
}