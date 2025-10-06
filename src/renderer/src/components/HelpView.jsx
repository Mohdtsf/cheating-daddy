import React, { useEffect, useState } from 'react';

export default function HelpView({ onExternalLink = (url) => (window.open ? window.open(url, '_blank') : null) }) {
    const [keybinds, setKeybinds] = useState(() => getDefaultKeybinds());

    useEffect(() => {
        // call resize helper if available (parity with Lit connectedCallback)
        try {
            if (typeof window.resizeLayout === 'function') window.resizeLayout();
        } catch (e) { }

        // load custom keybinds from localStorage
        const saved = localStorage.getItem('customKeybinds');
        if (saved) {
            try {
                setKeybinds((prev) => ({ ...prev, ...JSON.parse(saved) }));
            } catch (e) {
                console.error('Failed to parse customKeybinds:', e);
            }
        }
    }, []);

    function handleExternalLink(url) {
        // Prefer prop
        try {
            if (onExternalLink) return onExternalLink(url);
        } catch (e) {
            console.warn('onExternalLink handler failed', e);
        }

        // Prefer window.cheddar helper if present
        try {
            if (window.cheddar && typeof window.cheddar.openExternal === 'function') {
                return window.cheddar.openExternal(url);
            }
        } catch (e) { }

        // Try electron IPC invoke
        try {
            if (window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
                return window.electron.ipcRenderer.invoke('open-external', url);
            }
        } catch (e) { }

        // Fallback to window.open
        try {
            return window.open(url, '_blank');
        } catch (e) {
            console.error('Failed to open external link', url, e);
        }
    }

    function getDefaultKeybinds() {
        const isMac = (window.cheddar && window.cheddar.isMacOS) || (navigator.platform || '').toLowerCase().includes('mac');
        return {
            moveUp: isMac ? 'Alt+Up' : 'Ctrl+Up',
            moveDown: isMac ? 'Alt+Down' : 'Ctrl+Down',
            moveLeft: isMac ? 'Alt+Left' : 'Ctrl+Left',
            moveRight: isMac ? 'Alt+Right' : 'Ctrl+Right',
            toggleVisibility: isMac ? "Cmd+\\" : 'Ctrl+\\',
            toggleClickThrough: isMac ? 'Cmd+M' : 'Ctrl+M',
            nextStep: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
            previousResponse: isMac ? 'Cmd+[' : 'Ctrl+[',
            nextResponse: isMac ? 'Cmd+]' : 'Ctrl+]',
            scrollUp: isMac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
            scrollDown: isMac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
        };
    }

    function formatKeybind(keybind) {
        if (!keybind) return null;
        return keybind.split('+').map((k, i) => (
            <span key={i} className="key inline-block bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-xs font-medium px-2 py-0.5 rounded font-mono mr-1">
                {k}
            </span>
        ));
    }

    const communityLinks = [
        { label: 'Official Website', url: 'https://cheatingdaddy.com', emoji: '🌐' },
        { label: 'GitHub Repository', url: 'https://github.com/sohzm/cheating-daddy', emoji: '📂' },
        { label: 'Discord Community', url: 'https://discord.gg/GCBdubnXfJ', emoji: '💬' },
    ];

    const profiles = [
        { name: 'Job Interview', desc: 'Get help with interview questions and responses' },
        { name: 'Sales Call', desc: 'Assistance with sales conversations and objection handling' },
        { name: 'Business Meeting', desc: 'Support for professional meetings and discussions' },
        { name: 'Presentation', desc: 'Help with presentations and public speaking' },
        { name: 'Negotiation', desc: 'Guidance for business negotiations and deals' },
        { name: 'Exam Assistant', desc: 'Academic assistance for test-taking and exam questions' },
    ];

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-3">Help & Shortcuts</h2>

            <div className="grid gap-4">
                <div className="option-group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded p-4">
                    <div className="flex items-center gap-3 mb-3 font-semibold uppercase text-sm tracking-wide">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                        <span>Community & Support</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {communityLinks.map((l) => (
                            <button
                                key={l.url}
                                onClick={() => onExternalLink && onExternalLink(l.url)}
                                className="community-link flex items-center gap-2 px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded text-sm"
                            >
                                <span>{l.emoji}</span>
                                <span>{l.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="option-group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded p-4">
                    <div className="flex items-center gap-3 mb-3 font-semibold uppercase text-sm tracking-wide">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                        <span>Keyboard Shortcuts</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="keyboard-group p-3 bg-[rgba(0,0,0,0.2)] rounded">
                            <div className="text-sm font-semibold mb-2">Window Movement</div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between"><div>Move window up</div><div>{formatKeybind(keybinds.moveUp)}</div></div>
                                <div className="flex justify-between"><div>Move window down</div><div>{formatKeybind(keybinds.moveDown)}</div></div>
                                <div className="flex justify-between"><div>Move window left</div><div>{formatKeybind(keybinds.moveLeft)}</div></div>
                                <div className="flex justify-between"><div>Move window right</div><div>{formatKeybind(keybinds.moveRight)}</div></div>
                            </div>
                        </div>

                        <div className="keyboard-group p-3 bg-[rgba(0,0,0,0.2)] rounded">
                            <div className="text-sm font-semibold mb-2">Window Control</div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between"><div>Toggle click-through mode</div><div>{formatKeybind(keybinds.toggleClickThrough)}</div></div>
                                <div className="flex justify-between"><div>Toggle window visibility</div><div>{formatKeybind(keybinds.toggleVisibility)}</div></div>
                            </div>
                        </div>

                        <div className="keyboard-group p-3 bg-[rgba(0,0,0,0.2)] rounded">
                            <div className="text-sm font-semibold mb-2">AI Actions</div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between"><div>Take screenshot and ask for next step</div><div>{formatKeybind(keybinds.nextStep)}</div></div>
                            </div>
                        </div>

                        <div className="keyboard-group p-3 bg-[rgba(0,0,0,0.2)] rounded">
                            <div className="text-sm font-semibold mb-2">Response Navigation</div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between"><div>Previous response</div><div>{formatKeybind(keybinds.previousResponse)}</div></div>
                                <div className="flex justify-between"><div>Next response</div><div>{formatKeybind(keybinds.nextResponse)}</div></div>
                                <div className="flex justify-between"><div>Scroll response up</div><div>{formatKeybind(keybinds.scrollUp)}</div></div>
                                <div className="flex justify-between"><div>Scroll response down</div><div>{formatKeybind(keybinds.scrollDown)}</div></div>
                            </div>
                        </div>

                        <div className="keyboard-group p-3 bg-[rgba(0,0,0,0.2)] rounded md:col-span-2">
                            <div className="text-sm font-semibold mb-2">Text Input</div>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between"><div>Send message to AI</div><div className="flex">{formatKeybind('Enter')}</div></div>
                                <div className="flex justify-between"><div>New line in text input</div><div className="flex">{formatKeybind('Shift+Enter')}</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-400 italic text-center mt-3">💡 You can customize these shortcuts in the Settings page!</div>
                </div>

                <div className="option-group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded p-4">
                    <div className="flex items-center gap-3 mb-3 font-semibold uppercase text-sm tracking-wide">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                        <span>How to Use</span>
                    </div>

                    <div className="usage-steps space-y-2 text-sm text-gray-300">
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">1</div><div><strong>Start a Session:</strong> Enter your Gemini API key and click "Start Session"</div></div>
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">2</div><div><strong>Customize:</strong> Choose your profile and language in the settings</div></div>
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">3</div><div><strong>Position Window:</strong> Use keyboard shortcuts to move the window to your desired location</div></div>
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">4</div><div><strong>Click-through Mode:</strong> Use {formatKeybind(keybinds.toggleClickThrough)} to make the window click-through</div></div>
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">5</div><div><strong>Get AI Help:</strong> The AI will analyze your screen and audio to provide assistance</div></div>
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">6</div><div><strong>Text Messages:</strong> Type questions or requests to the AI using the text input</div></div>
                        <div className="usage-step flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">7</div><div><strong>Navigate Responses:</strong> Use {formatKeybind(keybinds.previousResponse)} and {formatKeybind(keybinds.nextResponse)} to browse through AI responses</div></div>
                    </div>
                </div>

                <div className="option-group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded p-4">
                    <div className="flex items-center gap-3 mb-3 font-semibold uppercase text-sm tracking-wide">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                        <span>Supported Profiles</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {profiles.map((p) => (
                            <div key={p.name} className="profile-item bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.04)] rounded p-3">
                                <div className="profile-name font-semibold text-sm mb-1">{p.name}</div>
                                <div className="profile-description text-xs text-gray-300">{p.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="option-group bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded p-4">
                    <div className="flex items-center gap-3 mb-3 font-semibold uppercase text-sm tracking-wide">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded" />
                        <span>Audio Input</span>
                    </div>
                    <div className="description text-sm text-gray-300">The AI listens to conversations and provides contextual assistance based on what it hears.</div>
                </div>
            </div>
        </div>
    );
}
