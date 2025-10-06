import React, { useEffect, useRef, useState } from 'react';
import MainView from './components/MainView';
import AppHeader from './components/AppHeader';
import AssistantView from './components/AssistantView';
import OnboardingView from './components/OnboardingView';
import CustomizeView from './components/CustomizeView';
import HistoryView from './components/HistoryView';
import HelpView from './components/HelpView';
import AdvancedView from './components/AdvancedView';
import './cheddarShim';

function CheatingDaddyApp() {
    const [currentView, setCurrentView] = useState(localStorage.getItem('onboardingCompleted') ? 'main' : 'onboarding');
    const [statusText, setStatusText] = useState('');
    const [responses, setResponses] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);

    const [selectedProfile, setSelectedProfile] = useState(localStorage.getItem('selectedProfile') || 'interview');
    const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('selectedLanguage') || 'en-US');
    const [selectedScreenshotInterval, setSelectedScreenshotInterval] = useState(localStorage.getItem('selectedScreenshotInterval') || '5');
    const [selectedImageQuality, setSelectedImageQuality] = useState(localStorage.getItem('selectedImageQuality') || 'medium');
    const [layoutMode, setLayoutMode] = useState(localStorage.getItem('layoutMode') || 'normal');
    const [advancedMode, setAdvancedMode] = useState(localStorage.getItem('advancedMode') === 'true');

    const [currentResponseIndex, setCurrentResponseIndex] = useState(-1);
    const awaitingNewResponseRef = useRef(false);
    const currentResponseCompleteRef = useRef(true);
    const [shouldAnimateResponse, setShouldAnimateResponse] = useState(false);

    const elementRef = useRef({});
    const apiRef = useRef({});
    const viewContainerRef = useRef(null);

    // Detect platform hints
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
    const isLinux = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('LINUX');

    useEffect(() => {
        // element-like object returned by cheddar.element()
        elementRef.current = {
            handleStart: async () => {
                const apiKey = localStorage.getItem('apiKey') || '';
                if (!apiKey || apiKey.trim() === '') {
                    // Trigger the blink on main view if available via window.cheddar.element
                    const mainView = apiRef.current?.element?.();
                    if (mainView && mainView.triggerApiKeyError) mainView.triggerApiKeyError();
                    return;
                }
                setResponses([]);
                setCurrentResponseIndex(-1);
                setCurrentView('assistant');
            },
            triggerApiKeyError: () => {
                setStatusText('API key missing');
                setTimeout(() => setStatusText(''), 1200);
            },
        };

        const impl = {
            element: () => elementRef.current,
            e: () => elementRef.current,
            getCurrentView: () => currentView,
            getLayoutMode: () => localStorage.getItem('layoutMode') || 'normal',
            setStatus: (text) => setStatusText(text),
            setResponse: (response) => {
                // simplified push for external callers
                setResponses((prev) => [...prev, response]);
                setCurrentResponseIndex((prev) => prev + 1);
            },
            initializeGemini: async (profile, language) => {
                // Read API key and custom prompt from localStorage and call main process
                try {
                    // If running without Electron (vite dev), just no-op and return success
                    if (!window?.electron || !window.electron.ipcRenderer) {
                        console.debug('initializeGemini: running without Electron bridge — no-op in dev');
                        return { success: true };
                    }

                    const apiKey = (localStorage.getItem('apiKey') || '').trim();
                    if (!apiKey) return { success: false, error: 'No API key' };
                    const customPrompt = localStorage.getItem('customPrompt') || '';
                    const res = await window.electron.ipcRenderer.invoke('initialize-gemini', apiKey, customPrompt, profile, language);
                    return { success: Boolean(res) };
                } catch (e) {
                    console.warn('initializeGemini failed', e);
                    return { success: false, error: e?.message || String(e) };
                }
            },
            startCapture: (interval, quality) => {
                try {
                    window.electron?.ipcRenderer?.send('start-capture', { interval, quality });
                } catch (e) {
                    console.log('startCapture', interval, quality);
                }
            },
            stopCapture: () => {
                try {
                    window.electron?.ipcRenderer?.send('stop-capture');
                } catch (e) {
                    console.log('stopCapture');
                }
            },
            sendTextMessage: async (msg) => {
                try {
                    if (!window?.electron || !window.electron.ipcRenderer) {
                        return { success: false, error: 'Not running inside Electron. Start the app with `npm start` to use Gemini integration.' };
                    }

                    const res = await window.electron.ipcRenderer.invoke('send-text-message', msg);
                    return res || { success: false, error: 'no response' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            },
            handleShortcut: (key) => console.log('handleShortcut', key),
            getAllConversationSessions: async () => [],
            getConversationSession: async (id) => null,
            initConversationStorage: async () => { },
            getContentProtection: () => {
                const contentProtection = localStorage.getItem('contentProtection');
                return contentProtection !== null ? contentProtection === 'true' : true;
            },
            isLinux: isLinux,
            isMacOS: isMac,
            openExternal: (url) => {
                try {
                    window.electron?.ipcRenderer?.invoke('open-external', url);
                } catch (e) {
                    window.open(url, '_blank');
                }
            },
        };

        window.__setCheddarImplementation(impl);
        apiRef.current = impl;

        // IPC listeners from main process
        try {
            window.electron?.ipcRenderer?.on('update-response', (_, response) => {
                // emulate setResponse streaming logic from original
                setResponses((prev) => {
                    const isFiller = typeof response === 'string' && response.length < 30 && /(hmm|okay|next|go on|continue)/i.test(response);
                    if (awaitingNewResponseRef.current || prev.length === 0) {
                        awaitingNewResponseRef.current = false;
                        currentResponseCompleteRef.current = false;
                        setCurrentResponseIndex(prev.length);
                        return [...prev, response];
                    } else if (!currentResponseCompleteRef.current && !isFiller && prev.length > 0) {
                        // update last
                        return [...prev.slice(0, prev.length - 1), response];
                    } else {
                        currentResponseCompleteRef.current = false;
                        setCurrentResponseIndex(prev.length);
                        return [...prev, response];
                    }
                });
                setShouldAnimateResponse(true);
            });

            window.electron?.ipcRenderer?.on('update-status', (_, status) => {
                setStatusText(status);
                if (/Ready|Listening|Error/.test(status)) {
                    currentResponseCompleteRef.current = true;
                }
            });

            window.electron?.ipcRenderer?.on('click-through-toggled', (_, isEnabled) => {
                // nothing to do for now; AppHeader may display state
            });
        } catch (e) {
            // noop
        }

        // cleanup on unmount
        return () => {
            try {
                window.electron?.ipcRenderer?.removeAllListeners('update-response');
                window.electron?.ipcRenderer?.removeAllListeners('update-status');
                window.electron?.ipcRenderer?.removeAllListeners('click-through-toggled');
            } catch (e) { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist settings when changed
    useEffect(() => {
        localStorage.setItem('selectedProfile', selectedProfile);
    }, [selectedProfile]);
    useEffect(() => {
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }, [selectedLanguage]);
    useEffect(() => {
        localStorage.setItem('selectedScreenshotInterval', selectedScreenshotInterval);
    }, [selectedScreenshotInterval]);
    useEffect(() => {
        localStorage.setItem('selectedImageQuality', selectedImageQuality);
    }, [selectedImageQuality]);
    useEffect(() => {
        localStorage.setItem('advancedMode', advancedMode.toString());
    }, [advancedMode]);

    useEffect(() => {
        // notify main process when view changes and animate view container
        try {
            window.electron?.ipcRenderer?.send('view-changed', currentView);
        } catch (e) { }

        if (viewContainerRef.current) {
            viewContainerRef.current.classList.add('entering');
            requestAnimationFrame(() => viewContainerRef.current && viewContainerRef.current.classList.remove('entering'));
        }
    }, [currentView]);

    useEffect(() => {
        // apply layout mode to root element
        if (layoutMode === 'compact') document.documentElement.classList.add('compact-layout');
        else document.documentElement.classList.remove('compact-layout');
    }, [layoutMode]);

    function updateLayoutMode(mode) {
        setLayoutMode(mode);
        localStorage.setItem('layoutMode', mode);
        // ask main to update sizes if possible
        try {
            window.electron?.ipcRenderer?.invoke('update-sizes');
        } catch (e) { }
    }

    async function handleStart() {
        const apiKey = (localStorage.getItem('apiKey') || '').trim();
        if (!apiKey) {
            // trigger blink on MainView
            const mainView = apiRef.current?.element?.();
            if (mainView && mainView.triggerApiKeyError) mainView.triggerApiKeyError();
            return;
        }

        await apiRef.current.initializeGemini(selectedProfile, selectedLanguage);
        apiRef.current.startCapture(selectedScreenshotInterval, selectedImageQuality);
        setResponses([]);
        setCurrentResponseIndex(-1);
        setStartTime(Date.now());
        setCurrentView('assistant');
    }

    async function handleAPIKeyHelp() {
        try {
            await window.electron?.ipcRenderer?.invoke('open-external', 'https://cheatingdaddy.com/help/api-key');
        } catch (e) {
            window.open('https://cheatingdaddy.com/help/api-key', '_blank');
        }
    }

    async function handleClose() {
        if (currentView === 'customize' || currentView === 'help' || currentView === 'history') {
            setCurrentView('main');
            return;
        }

        if (currentView === 'assistant') {
            apiRef.current.stopCapture?.();
            try {
                await window.electron?.ipcRenderer?.invoke('close-session');
            } catch (e) { }
            setSessionActive(false);
            setCurrentView('main');
            return;
        }

        try {
            await window.electron?.ipcRenderer?.invoke('quit-application');
        } catch (e) { }
    }

    async function handleHideToggle() {
        try {
            await window.electron?.ipcRenderer?.invoke('toggle-window-visibility');
        } catch (e) { }
    }

    async function handleSendText(message) {
        const result = await apiRef.current.sendTextMessage(message);
        if (!result.success) {
            console.error('Failed to send message:', result.error);
            setStatusText('Error sending message: ' + (result.error || 'unknown'));
        } else {
            setStatusText('Message sent...');
            awaitingNewResponseRef.current = true;
        }
    }

    function handleResponseIndexChanged(index) {
        setCurrentResponseIndex(index);
        setShouldAnimateResponse(false);
    }

    // Rendering
    const mainContentClass = `main-content ${currentView === 'assistant' ? 'assistant-view' : currentView === 'onboarding' ? 'onboarding-view' : 'with-border'}`;

    return (
        <div className="window-container min-h-screen">
            <style>{`
                :root { --main-content-padding: 20px; --main-content-margin-top: 0px; }
                .main-content { transition: all 0.15s ease-out; }
                .entering { opacity: 0; transform: translateY(8px); }
                /* scrollbars */
                .main-content::-webkit-scrollbar { width: 6px; height: 6px; }
                .main-content::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                .main-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
            `}</style>

            <div className="w-full flex flex-col h-screen bg-black text-gray-100 px-4 sm:px-6 md:px-8">
                <AppHeader
                    currentView={currentView}
                    startTime={startTime}
                    statusText={statusText}
                    onCustomize={() => setCurrentView('customize')}
                    onHelp={() => setCurrentView('help')}
                    onHistory={() => setCurrentView('history')}
                    onClose={() => handleClose()}
                    onBack={() => setCurrentView('main')}
                    onHideToggle={() => handleHideToggle()}
                    advancedMode={advancedMode}
                    onAdvanced={() => setCurrentView('advanced')}
                />

                <div className={mainContentClass + ' flex-1 overflow-auto p-[var(--main-content-padding)] '}>
                    <div ref={viewContainerRef} className="view-container w-full h-full">
                        {currentView === 'main' && <MainView onStart={handleStart} onAPIKeyHelp={handleAPIKeyHelp} onLayoutModeChange={updateLayoutMode} />}
                        {currentView === 'onboarding' && <OnboardingView onComplete={() => setCurrentView('main')} onClose={() => handleClose()} />}
                        {currentView === 'customize' && (
                            <CustomizeView
                                selectedProfile={selectedProfile}
                                selectedLanguage={selectedLanguage}
                                selectedScreenshotInterval={selectedScreenshotInterval}
                                selectedImageQuality={selectedImageQuality}
                                layoutMode={layoutMode}
                                advancedMode={advancedMode}
                                onProfileChange={(p) => setSelectedProfile(p)}
                                onLanguageChange={(l) => setSelectedLanguage(l)}
                                onScreenshotIntervalChange={(i) => setSelectedScreenshotInterval(i)}
                                onImageQualityChange={(q) => setSelectedImageQuality(q)}
                                onLayoutModeChange={(m) => updateLayoutMode(m)}
                                onAdvancedModeChange={(am) => setAdvancedMode(am)}
                            />
                        )}
                        {currentView === 'history' && <HistoryView />}
                        {currentView === 'help' && <HelpView onExternalLink={(url) => apiRef.current.openExternal(url)} />}
                        {currentView === 'advanced' && <AdvancedView />}
                        {currentView === 'assistant' && (
                            <AssistantView
                                responses={responses}
                                currentIndex={currentResponseIndex}
                                onSendText={handleSendText}
                                onResponseIndexChanged={(idx) => handleResponseIndexChanged(idx)}
                                shouldAnimateResponse={shouldAnimateResponse}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return <CheatingDaddyApp />;
}
