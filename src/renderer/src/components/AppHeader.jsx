import React, { useEffect, useMemo, useState } from 'react';

export default function AppHeader({
    currentView = 'main',
    startTime = null,
    statusText = '',
    onCustomize = () => { },
    onHelp = () => { },
    onHistory = () => { },
    onClose = () => { },
    onBack = () => { },
    onHideToggle = () => { },
    advancedMode = false,
    onAdvanced = () => { },
    isClickThrough = false,
}) {
    const [elapsed, setElapsed] = useState('');

    const titles = useMemo(
        () => ({
            onboarding: 'Welcome to Cheating Daddy',
            main: 'Cheating Daddy',
            customize: 'Customize',
            help: 'Help & Shortcuts',
            history: 'Conversation History',
            advanced: 'Advanced Tools',
            assistant: 'Cheating Daddy',
        }),
        []
    );

    const viewTitle = titles[currentView] || 'Cheating Daddy';
    const isNavigationView = ['customize', 'help', 'history', 'advanced'].includes(currentView);

    useEffect(() => {
        let id = null;
        function update() {
            if (currentView === 'assistant' && startTime) {
                const seconds = Math.floor((Date.now() - startTime) / 1000);
                setElapsed(`${seconds}s`);
            } else {
                setElapsed('');
            }
        }

        update();
        if (currentView === 'assistant' && startTime) {
            id = setInterval(update, 1000);
        }
        return () => {
            if (id) clearInterval(id);
        };
    }, [currentView, startTime]);

    function isMac() {
        try {
            return Boolean(window?.cheddar?.isMacOS) || navigator.platform.includes('Mac');
        } catch (e) {
            return navigator.platform.includes('Mac');
        }
    }

    // CSS regions: header should be draggable but action buttons must be no-drag
    const headerStyle = { WebkitAppRegion: 'drag' };
    const actionsStyle = { WebkitAppRegion: 'no-drag' };

    // Disable hover highlight when click-through is active
    const hoverBg = isClickThrough ? 'hover:bg-transparent' : 'hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200';

    return (
        <div className="w-full" style={headerStyle}>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-800/20 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-md shadow-lg">
                <div className="flex-1 text-lg md:text-xl font-bold text-white truncate bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {viewTitle}
                </div>

                <div className="flex items-center gap-2 md:gap-3 ml-4" style={actionsStyle}>
                    {currentView === 'assistant' && (
                        <>
                            <span className="text-sm md:text-base text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded-full">{elapsed}</span>
                            <span className="text-sm md:text-base text-gray-300 font-medium bg-gray-800/50 px-2 py-1 rounded-full">{statusText}</span>
                        </>
                    )}

                    {currentView === 'main' && (
                        <>
                            <button
                                className={`p-2 rounded-full opacity-80 ${hoverBg} text-white hover:text-blue-400 transition-all duration-200`}
                                onClick={onHistory}
                                title="History"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 21V7C12 5.89543 12.8954 5 14 5H21.4C21.7314 5 22 5.26863 22 5.6V18.7143" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <path d="M12 21V7C12 5.89543 11.1046 5 10 5H2.6C2.26863 5 2 5.26863 2 5.6V18.7143" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <path d="M14 19L22 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <path d="M10 19L2 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                </svg>
                            </button>

                            <button
                                className={`p-2 rounded-full opacity-80 ${hoverBg} text-white hover:text-purple-400 transition-all duration-200`}
                                onClick={onAdvanced}
                                title="Advanced"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.5 15L5.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <path d="M16 4L8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <path d="M9 4.5V10.2602C9 10.7376 8.82922 11.1992 8.51851 11.5617L3.48149 17.4383C3.17078 17.8008 3 18.2624 3 18.7398V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V18.7398C21 18.2624 20.8292 17.8008 20.5185 17.4383L15.4815 11.5617C15.1708 11.1992 15 10.7376 15 10.2602V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 9.01L12.01 8.99889" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M11 2.01L11.01 1.99889" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button
                                className={`p-2 rounded-full opacity-80 ${hoverBg} text-white hover:text-green-400 transition-all duration-200`}
                                onClick={onCustomize}
                                title="Customize"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            <button
                                className={`p-2 rounded-full opacity-80 ${hoverBg} text-white hover:text-yellow-400 transition-all duration-200`}
                                onClick={onHelp}
                                title="Help"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 9C9 5.49997 14.5 5.5 14.5 9C14.5 11.5 12 10.9999 12 13.9999" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 18.01L12.01 17.9989" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </>
                    )}

                    {currentView === 'assistant' ? (
                        <>
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm ${hoverBg} bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-200`}
                                onClick={onHideToggle}
                                title="Hide"
                            >
                                Hide <span className="ml-2 px-2 py-0.5 rounded bg-gray-900 text-xs font-semibold">{isMac() ? 'Cmd' : 'Ctrl'}</span>
                            </button>

                            <button
                                className={`p-2 rounded-full opacity-80 ${hoverBg} text-white hover:text-red-400 transition-all duration-200`}
                                onClick={onClose}
                                title="Close"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <button
                            className={`p-2 rounded-full opacity-80 ${hoverBg} text-white hover:text-red-400 transition-all duration-200`}
                            onClick={isNavigationView ? onBack : onClose}
                            title="Close / Back"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}