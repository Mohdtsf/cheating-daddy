import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function AssistantView({ responses = [], currentIndex = -1, selectedProfile = 'interview', shouldAnimateResponse = true, onSendText = async () => { } }) {
    const responseContainerRef = useRef(null);
    const inputRef = useRef(null);
    const lastAnimatedCountRef = useRef(0);
    const timeoutsRef = useRef([]);
    const mountedRef = useRef(true);

    const [savedResponses, setSavedResponses] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('savedResponses') || '[]');
        } catch (e) {
            return [];
        }
    });

    // Load font-size from localStorage and apply CSS variable
    useEffect(() => {
        const fontSize = parseInt(localStorage.getItem('fontSize') || '20', 10) || 20;
        document.documentElement.style.setProperty('--response-font-size', `${fontSize}px`);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            timeoutsRef.current.forEach((t) => clearTimeout(t));
            timeoutsRef.current = [];
            // remove ipc listeners if added
            try {
                // Prefer the secure preload bridge when available
                if (window?.electron && window.electron.ipcRenderer) {
                    window.electron.ipcRenderer.removeAllListeners('navigate-previous-response');
                    window.electron.ipcRenderer.removeAllListeners('navigate-next-response');
                    window.electron.ipcRenderer.removeAllListeners('scroll-response-up');
                    window.electron.ipcRenderer.removeAllListeners('scroll-response-down');
                } else if (window?.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.removeAllListeners('navigate-previous-response');
                    ipcRenderer.removeAllListeners('navigate-next-response');
                    ipcRenderer.removeAllListeners('scroll-response-up');
                    ipcRenderer.removeAllListeners('scroll-response-down');
                }
            } catch (e) { }
        };
    }, []);

    // IPC handlers for navigation/scrolling
    useEffect(() => {
        try {
            // Prefer secure preload bridge listeners (exposed as window.electron.ipcRenderer)
            if (window?.electron && window.electron.ipcRenderer) {
                const ipc = window.electron.ipcRenderer;
                const prev = () => navigateToPreviousResponse();
                const next = () => navigateToNextResponse();
                const up = () => scrollResponseUp();
                const down = () => scrollResponseDown();

                ipc.on('navigate-previous-response', prev);
                ipc.on('navigate-next-response', next);
                ipc.on('scroll-response-up', up);
                ipc.on('scroll-response-down', down);
            } else if (window?.require) {
                // Fallback to legacy require if preload bridge is not available
                try {
                    const ipc = (window.require && window.require('electron')?.ipcRenderer) || null;
                    const prev = () => navigateToPreviousResponse();
                    const next = () => navigateToNextResponse();
                    const up = () => scrollResponseUp();
                    const down = () => scrollResponseDown();

                    if (ipc) {
                        ipc.on('navigate-previous-response', prev);
                        ipc.on('navigate-next-response', next);
                        ipc.on('scroll-response-up', up);
                        ipc.on('scroll-response-down', down);
                    }
                } catch (e) { }
            }
        } catch (e) { }
    }, [responses, currentIndex]);

    // Helper: render markdown using window.marked if available, else escape/format plain text
    const renderMarkdown = useCallback((content) => {
        if (!content) return '';
        try {
            if (typeof window !== 'undefined' && window.marked) {
                try {
                    window.marked.setOptions({ breaks: true, gfm: true, sanitize: false });
                    const html = window.marked.parse(content);
                    return wrapWordsInSpans(html);
                } catch (e) {
                    return escapeHtml(content);
                }
            }
        } catch (e) { }
        return escapeHtml(content);
    }, []);

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/\'/g, '&#39;');
    }

    function wrapWordsInSpans(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const tagsToSkip = new Set(['PRE', 'CODE']);

            function wrap(node) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && !tagsToSkip.has(node.parentNode?.tagName)) {
                    const words = node.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    words.forEach((w) => {
                        if (w.trim()) {
                            const span = document.createElement('span');
                            span.setAttribute('data-word', '');
                            span.textContent = w;
                            frag.appendChild(span);
                        } else {
                            frag.appendChild(document.createTextNode(w));
                        }
                    });
                    node.parentNode.replaceChild(frag, node);
                } else if (node.nodeType === Node.ELEMENT_NODE && !tagsToSkip.has(node.tagName)) {
                    Array.from(node.childNodes).forEach(wrap);
                }
            }

            Array.from(doc.body.childNodes).forEach(wrap);
            return doc.body.innerHTML;
        } catch (e) {
            return html;
        }
    }

    // Animate only newly added words
    useEffect(() => {
        const container = responseContainerRef.current;
        if (!container) return;

        const currentResponse = getCurrentResponseContent();
        const rendered = renderMarkdown(currentResponse);
        container.innerHTML = rendered;

        const words = Array.from(container.querySelectorAll('[data-word]'));
        const prev = lastAnimatedCountRef.current || 0;

        if (!shouldAnimateResponse) {
            words.forEach((w) => w.classList.add('visible'));
            lastAnimatedCountRef.current = words.length;
            // scroll to bottom after render
            scrollToBottom();
            return;
        }

        // mark already visible for previous words
        for (let i = 0; i < Math.min(prev, words.length); i++) {
            words[i].classList.add('visible');
        }

        // animate new words
        for (let i = prev; i < words.length; i++) {
            const t = setTimeout(() => {
                words[i].classList.add('visible');
                if (i === words.length - 1) {
                    // notify when complete if needed
                    const ev = new CustomEvent('response-animation-complete');
                    window.dispatchEvent(ev);
                }
            }, (i - prev) * 70);
            timeoutsRef.current.push(t);
        }

        lastAnimatedCountRef.current = words.length;
        // scroll after short delay to allow animation to start
        setTimeout(() => scrollToBottom(), 50);

        return () => {
            timeoutsRef.current.forEach((t) => clearTimeout(t));
            timeoutsRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [responses, currentIndex, shouldAnimateResponse]);

    function getCurrentResponseContent() {
        const profileNames = {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
            exam: 'Exam Assistant',
        };

        if (responses && responses.length > 0 && currentIndex >= 0 && currentIndex < responses.length) return responses[currentIndex];
        return `Hey, I'm listening to your ${profileNames[selectedProfile] || 'session'}?`;
    }

    function getResponseCounter() {
        return responses && responses.length > 0 ? `${currentIndex + 1}/${responses.length}` : '';
    }

    function navigateToPreviousResponse() {
        try {
            const ev = new CustomEvent('navigate-response', { detail: { delta: -1 } });
            window.dispatchEvent(ev);
        } catch (e) { }
    }

    function navigateToNextResponse() {
        try {
            const ev = new CustomEvent('navigate-response', { detail: { delta: 1 } });
            window.dispatchEvent(ev);
        } catch (e) { }
    }

    function scrollResponseUp() {
        const container = responseContainerRef.current;
        if (!container) return;
        const amount = Math.max(100, container.clientHeight * 0.3);
        container.scrollTop = Math.max(0, container.scrollTop - amount);
    }

    function scrollResponseDown() {
        const container = responseContainerRef.current;
        if (!container) return;
        const amount = Math.max(100, container.clientHeight * 0.3);
        container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + amount);
    }

    function scrollToBottom() {
        const container = responseContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }

    function saveCurrentResponse() {
        const current = getCurrentResponseContent();
        if (!current) return;
        if (isResponseSaved()) return;
        const entry = { response: current, timestamp: new Date().toISOString(), profile: selectedProfile };
        const next = [...savedResponses, entry];
        setSavedResponses(next);
        try {
            localStorage.setItem('savedResponses', JSON.stringify(next));
        } catch (e) { }
    }

    function isResponseSaved() {
        const current = getCurrentResponseContent();
        return savedResponses.some((s) => s.response === current);
    }

    // sending text
    async function handleSendText() {
        const input = inputRef.current;
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        try {
            await onSendText(text);
        } catch (e) {
            console.warn('onSendText failed', e);
        }
    }

    function handleInputKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    }

    const responseCounter = getResponseCounter();
    const saved = isResponseSaved();

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-black p-4">
            <style>{`
                .response-word { opacity: 0; filter: blur(8px); display: inline-block; transition: opacity 0.35s ease, filter 0.35s ease; }
                .response-word.visible { opacity: 1; filter: blur(0); }
                .response-container { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border-radius: 12px; }
                .nav-button:hover { background: rgba(255, 255, 255, 0.1); }
                .nav-button:disabled { opacity: 0.5; cursor: not-allowed; }
                .save-button:hover { background: rgba(255, 255, 255, 0.1); color: #34d399; }
                textarea { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); }
                textarea:focus { border-color: #4f46e5; outline: none; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2); }
            `}</style>

            <div ref={responseContainerRef} id="responseContainer" className="response-container flex-1 overflow-y-auto p-6 rounded-lg shadow-lg" style={{ background: 'var(--main-content-background)', fontSize: 'var(--response-font-size,18px)', lineHeight: 1.6 }} />

            <div className="mt-4 flex items-center gap-3">
                <button className="nav-button w-10 h-10 rounded-full bg-transparent text-white flex items-center justify-center transition-all duration-200" onClick={navigateToPreviousResponse} disabled={currentIndex <= 0} title="Previous">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>

                {responses.length > 0 ? <span className="response-counter text-sm text-gray-400 font-mono min-w-[52px] text-center bg-gray-800/50 px-2 py-1 rounded-full">{responseCounter}</span> : null}

                <button className={`save-button w-10 h-10 rounded-full text-white flex items-center justify-center transition-all duration-200 ${saved ? 'text-green-400' : ''}`} onClick={saveCurrentResponse} title={saved ? 'Response saved' : 'Save this response'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 20V5C5 3.89543 5.89543 3 7 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L19.4142 5.41421C19.7893 5.78929 20 6.29799 20 6.82843V20C20 21.1046 19.1046 22 18 22H7C5.89543 22 5 21 5 20Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15 22V13H9V22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path><path d="M9 3V8H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </button>

                <textarea ref={inputRef} id="textInput" placeholder="Type a message to the AI..." onKeyDown={handleInputKeyDown} className="flex-1 px-4 py-3 rounded-lg border text-sm text-white resize-none focus:outline-none transition-all duration-200" />

                <button className="nav-button w-10 h-10 rounded-full bg-transparent text-white flex items-center justify-center transition-all duration-200" onClick={navigateToNextResponse} disabled={currentIndex >= responses.length - 1} title="Next">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>
        </div>
    );
}