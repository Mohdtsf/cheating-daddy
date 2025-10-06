import React, { useEffect, useRef, useState } from 'react';

const STORAGE_KEYS = {
    keybinds: 'customKeybinds',
    profile: 'selectedProfile',
    language: 'selectedLanguage',
    screenshotInterval: 'selectedScreenshotInterval',
    imageQuality: 'selectedImageQuality',
    layoutMode: 'layoutMode',
    googleSearch: 'googleSearchEnabled',
    advancedMode: 'advancedMode',
    backgroundTransparency: 'backgroundTransparency',
    fontSize: 'appFontSize',
};

function isMac() {
    try {
        return Boolean(window?.cheddar?.isMacOS) || navigator.platform.includes('Mac');
    } catch (e) {
        return navigator.platform.includes('Mac');
    }
}

function getDefaultKeybinds() {
    const mac = isMac();
    return {
        moveUp: mac ? 'Alt+Up' : 'Ctrl+Up',
        moveDown: mac ? 'Alt+Down' : 'Ctrl+Down',
        moveLeft: mac ? 'Alt+Left' : 'Ctrl+Left',
        moveRight: mac ? 'Alt+Right' : 'Ctrl+Right',
        toggleVisibility: mac ? 'Cmd+\\' : 'Ctrl+\\',
        toggleClickThrough: mac ? 'Cmd+M' : 'Ctrl+M',
        nextStep: mac ? 'Cmd+Enter' : 'Ctrl+Enter',
        previousResponse: mac ? 'Cmd+[' : 'Ctrl+[',
        nextResponse: mac ? 'Cmd+]' : 'Ctrl+]',
        scrollUp: mac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
        scrollDown: mac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
    };
}

function mapSpecialKey(code, key) {
    // Simplified mapping for common special keys
    switch (code) {
        case 'Space':
            return 'Space';
        case 'ArrowUp':
            return 'Up';
        case 'ArrowDown':
            return 'Down';
        case 'ArrowLeft':
            return 'Left';
        case 'ArrowRight':
            return 'Right';
        case 'Escape':
            return 'Esc';
        case 'Backspace':
            return 'Backspace';
        case 'Tab':
            return 'Tab';
        case 'Enter':
            return 'Enter';
        case 'Minus':
            return '-';
        default:
            return key.length === 1 ? key.toUpperCase() : key;
    }
}

export default function CustomizeView() {
    const [profiles] = useState([
        { value: 'interview', name: 'Job Interview', description: 'Get help with answering interview questions' },
        { value: 'sales', name: 'Sales Call', description: 'Assist with sales conversations and objection handling' },
        { value: 'meeting', name: 'Business Meeting', description: 'Support for professional meetings and discussions' },
        { value: 'presentation', name: 'Presentation', description: 'Help with presentations and public speaking' },
        { value: 'negotiation', name: 'Negotiation', description: 'Guidance for business negotiations and deals' },
        { value: 'exam', name: 'Exam Assistant', description: 'Academic assistance for test-taking and exam questions' },
    ]);

    // Languages list expanded to match the original Lit component for parity
    const [languages] = useState([
        { value: 'en-US', name: 'English (US)' },
        { value: 'en-GB', name: 'English (UK)' },
        { value: 'en-AU', name: 'English (Australia)' },
        { value: 'en-IN', name: 'English (India)' },
        { value: 'de-DE', name: 'German (Germany)' },
        { value: 'es-US', name: 'Spanish (United States)' },
        { value: 'es-ES', name: 'Spanish (Spain)' },
        { value: 'fr-FR', name: 'French (France)' },
        { value: 'fr-CA', name: 'French (Canada)' },
        { value: 'hi-IN', name: 'Hindi (India)' },
        { value: 'pt-BR', name: 'Portuguese (Brazil)' },
        { value: 'ar-XA', name: 'Arabic (Generic)' },
        { value: 'id-ID', name: 'Indonesian (Indonesia)' },
        { value: 'it-IT', name: 'Italian (Italy)' },
        { value: 'ja-JP', name: 'Japanese (Japan)' },
        { value: 'tr-TR', name: 'Turkish (Turkey)' },
        { value: 'vi-VN', name: 'Vietnamese (Vietnam)' },
        { value: 'bn-IN', name: 'Bengali (India)' },
        { value: 'gu-IN', name: 'Gujarati (India)' },
        { value: 'kn-IN', name: 'Kannada (India)' },
        { value: 'ml-IN', name: 'Malayalam (India)' },
        { value: 'mr-IN', name: 'Marathi (India)' },
        { value: 'ta-IN', name: 'Tamil (India)' },
        { value: 'te-IN', name: 'Telugu (India)' },
        { value: 'nl-NL', name: 'Dutch (Netherlands)' },
        { value: 'ko-KR', name: 'Korean (South Korea)' },
        { value: 'cmn-CN', name: 'Mandarin Chinese (China)' },
        { value: 'pl-PL', name: 'Polish (Poland)' },
        { value: 'ru-RU', name: 'Russian (Russia)' },
        { value: 'th-TH', name: 'Thai (Thailand)' },
    ]);

    const [selectedProfile, setSelectedProfile] = useState(localStorage.getItem(STORAGE_KEYS.profile) || 'interview');
    const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem(STORAGE_KEYS.language) || 'en-US');
    const [screenshotInterval, setScreenshotInterval] = useState(localStorage.getItem(STORAGE_KEYS.screenshotInterval) || '5');
    const [imageQuality, setImageQuality] = useState(localStorage.getItem(STORAGE_KEYS.imageQuality) || 'medium');
    const [layoutMode, setLayoutMode] = useState(localStorage.getItem(STORAGE_KEYS.layoutMode) || 'normal');
    const [googleSearchEnabled, setGoogleSearchEnabled] = useState(() => {
        const v = localStorage.getItem(STORAGE_KEYS.googleSearch);
        return v === null ? true : v === 'true';
    });
    const [advancedMode, setAdvancedMode] = useState(() => localStorage.getItem(STORAGE_KEYS.advancedMode) === 'true');
    const [backgroundTransparency, setBackgroundTransparency] = useState(() => parseFloat(localStorage.getItem(STORAGE_KEYS.backgroundTransparency) || '0.8'));
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem(STORAGE_KEYS.fontSize) || '20', 10));

    const [keybinds, setKeybinds] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.keybinds);
            return saved ? JSON.parse(saved) : getDefaultKeybinds();
        } catch (e) {
            return getDefaultKeybinds();
        }
    });

    const keybindInputsRef = useRef({});

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.profile, selectedProfile);
    }, [selectedProfile]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.language, selectedLanguage);
    }, [selectedLanguage]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.screenshotInterval, screenshotInterval);
    }, [screenshotInterval]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.imageQuality, imageQuality);
    }, [imageQuality]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.layoutMode, layoutMode);
    }, [layoutMode]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.googleSearch, String(googleSearchEnabled));
    }, [googleSearchEnabled]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.advancedMode, String(advancedMode));
    }, [advancedMode]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.backgroundTransparency, String(backgroundTransparency));
        updateBackgroundTransparency(backgroundTransparency);
    }, [backgroundTransparency]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.fontSize, String(fontSize));
        updateFontSize(fontSize);
    }, [fontSize]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.keybinds, JSON.stringify(keybinds));
        } catch (e) { }
    }, [keybinds]);

    function updateBackgroundTransparency(value) {
        const root = document.documentElement;
        root.style.setProperty('--header-background', `rgba(0,0,0,${value})`);
        root.style.setProperty('--main-content-background', `rgba(0,0,0,${value})`);
        root.style.setProperty('--card-background', `rgba(255,255,255,${value * 0.05})`);
        root.style.setProperty('--input-background', `rgba(0,0,0,${value * 0.375})`);
        root.style.setProperty('--input-focus-background', `rgba(0,0,0,${value * 0.625})`);
        root.style.setProperty('--button-background', `rgba(0,0,0,${value * 0.625})`);
    }

    function updateFontSize(size) {
        const root = document.documentElement;
        root.style.setProperty('--app-font-size', `${size}px`);
        // also adjust body font-size as a fallback
        document.documentElement.style.fontSize = `${size}px`;
    }

    function saveKeybindsToMain(saved) {
        // Prefer window.cheddar API if present, otherwise fallback to electron ipc
        if (window?.cheddar?.updateGlobalShortcuts) {
            try {
                window.cheddar.updateGlobalShortcuts(saved);
            } catch (e) { }
            return;
        }

        // Prefer secure preload bridge
        try {
            if (window?.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
                window.electron.ipcRenderer.invoke('update-global-shortcuts', saved).catch(() => { });
                return;
            }
        } catch (e) { }

        try {
            if (window?.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.invoke('update-global-shortcuts', saved).catch(() => { });
            }
        } catch (e) { }
    }

    function handleKeybindFocus(e) {
        e.target.placeholder = 'Press key combination...';
        e.target.select();
    }

    function handleKeybindKeyDown(e) {
        e.preventDefault();
        e.stopPropagation();

        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.metaKey) modifiers.push('Cmd');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        const main = mapSpecialKey(e.code, e.key);

        // If only modifiers pressed, ignore
        if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

        const keybind = [...modifiers, main].join('+');

        const action = e.target.dataset.action;
        if (!action) return;

        const updated = { ...keybinds, [action]: keybind };
        setKeybinds(updated);
        saveKeybindsToMain(updated);

        // Update input value and blur
        e.target.value = keybind;
        e.target.blur();
    }

    function resetKeybinds() {
        const defaults = getDefaultKeybinds();
        setKeybinds(defaults);
        try {
            localStorage.removeItem(STORAGE_KEYS.keybinds);
        } catch (e) { }
        saveKeybindsToMain(defaults);
    }

    function handleKeybindChange(action, value) {
        const updated = { ...keybinds, [action]: value };
        setKeybinds(updated);
        saveKeybindsToMain(updated);
    }

    function getKeybindActions() {
        return [
            { key: 'moveUp', name: 'Move Window Up', description: 'Move the application window up' },
            { key: 'moveDown', name: 'Move Window Down', description: 'Move the application window down' },
            { key: 'moveLeft', name: 'Move Window Left', description: 'Move the application window left' },
            { key: 'moveRight', name: 'Move Window Right', description: 'Move the application window right' },
            { key: 'toggleVisibility', name: 'Toggle Window Visibility', description: 'Show/hide the application window' },
            { key: 'toggleClickThrough', name: 'Toggle Click-through Mode', description: 'Enable/disable click-through functionality' },
            { key: 'nextStep', name: 'Ask Next Step', description: 'Take screenshot and ask AI for the next step suggestion' },
            { key: 'previousResponse', name: 'Previous Response', description: 'Navigate to the previous AI response' },
            { key: 'nextResponse', name: 'Next Response', description: 'Navigate to the next AI response' },
            { key: 'scrollUp', name: 'Scroll Response Up', description: 'Scroll the AI response content up' },
            { key: 'scrollDown', name: 'Scroll Response Down', description: 'Scroll the AI response content down' },
        ];
    }

    return (
        // Use the same max width as the Lit component (700px) for visual parity
        <div className="p-3 max-w-[700px] mx-auto">
            <h2 className="text-2xl font-semibold mb-2">Customize</h2>
            <p className="text-sm text-gray-400 mb-6">Control profiles, screenshot interval, image quality and more.</p>

            <div className="grid gap-6">
                {/* Profiles / Basic Settings */}
                <section className="p-4 bg-[var(--card-background,rgba(255,255,255,0.04))] border border-[var(--card-border,rgba(255,255,255,0.08))] rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider">General</h3>
                        <span className="text-xs text-gray-400">Layout: {layoutMode}</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Profile</label>
                            <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className="form-select bg-[var(--input-background)] border border-[var(--input-border)] px-3 py-2 rounded text-sm">
                                {profiles.map((p) => (
                                    <option key={p.value} value={p.value}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Choose a helper profile to tailor suggestions.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Language</label>
                            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="form-select bg-[var(--input-background)] border border-[var(--input-border)] px-3 py-2 rounded text-sm">
                                {languages.map((l) => (
                                    <option key={l.value} value={l.value}>{l.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Select the language used for prompts and suggestions.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Screenshot interval (s)</label>
                            <select value={screenshotInterval} onChange={(e) => setScreenshotInterval(e.target.value)} className="form-select bg-[var(--input-background)] border border-[var(--input-border)] px-3 py-2 rounded text-sm">
                                <option value="2">2</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="30">30</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Image quality</label>
                            <select value={imageQuality} onChange={(e) => setImageQuality(e.target.value)} className="form-select bg-[var(--input-background)] border border-[var(--input-border)] px-3 py-2 rounded text-sm">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Keybinds */}
                <section className="p-4 bg-[var(--card-background,rgba(255,255,255,0.04))] border border-[var(--card-border,rgba(255,255,255,0.08))] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Keybinds</h3>
                        <button onClick={resetKeybinds} className="text-xs px-3 py-1 rounded bg-[var(--button-background,rgba(255,255,255,0.06))] border border-[var(--button-border,rgba(255,255,255,0.12))]">Reset</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-400 text-left">
                                    <th className="pb-2">Action</th>
                                    <th className="pb-2">Keybind</th>
                                    <th className="pb-2">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getKeybindActions().map((act) => (
                                    <tr key={act.key} className="border-t border-[var(--table-border,rgba(255,255,255,0.06))]">
                                        <td className="py-3 align-top font-medium">{act.name}</td>
                                        <td className="py-3 align-top">
                                            <input
                                                data-action={act.key}
                                                ref={(el) => (keybindInputsRef.current[act.key] = el)}
                                                onFocus={handleKeybindFocus}
                                                onKeyDown={handleKeybindKeyDown}
                                                value={keybinds[act.key] || ''}
                                                onChange={(e) => handleKeybindChange(act.key, e.target.value)}
                                                className="px-2 py-1 rounded border border-[var(--input-border)] bg-[var(--input-background)] text-sm w-40"
                                                placeholder="Press key combination..."
                                            />
                                        </td>
                                        <td className="py-3 align-top text-xs text-gray-400">{act.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Advanced / Appearance */}
                <section className="p-4 bg-[var(--card-background,rgba(255,255,255,0.04))] border border-[var(--card-border,rgba(255,255,255,0.08))] rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Appearance & Advanced</h3>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Background transparency</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="1" step="0.01" value={backgroundTransparency}
                                    onChange={(e) => setBackgroundTransparency(parseFloat(e.target.value))}
                                    className="w-full" />
                                <div className="text-xs w-12 text-right">{backgroundTransparency.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium">Base font size</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="12" max="32" step="1" value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                    className="w-full" />
                                <div className="text-xs w-12 text-right">{fontSize}px</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input id="googleSearch" type="checkbox" checked={googleSearchEnabled} onChange={(e) => setGoogleSearchEnabled(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="googleSearch" className="text-sm">Enable Google search for context</label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input id="advancedMode" type="checkbox" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="advancedMode" className="text-sm">Advanced mode (more controls)</label>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
