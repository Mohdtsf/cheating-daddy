import React, { useEffect, useState } from 'react';

export default function HistoryView() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sessions');
    const [savedResponses, setSavedResponses] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('savedResponses') || '[]');
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        // keep parity with Lit: resizeLayout when view connects (if provided)
        try {
            if (typeof window.resizeLayout === 'function') window.resizeLayout();
        } catch (e) { }

        let mounted = true;
        async function loadSessions() {
            setLoading(true);
            try {
                const result = (window.cheddar && window.cheddar.getAllConversationSessions)
                    ? await window.cheddar.getAllConversationSessions()
                    : [];
                if (mounted) setSessions(Array.isArray(result) ? result : []);
            } catch (err) {
                console.error('Error loading conversation sessions:', err);
                if (mounted) setSessions([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadSessions();
        return () => { mounted = false; };
    }, []);

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    function getSessionPreview(session) {
        if (!session?.conversationHistory || session.conversationHistory.length === 0) return 'No conversation yet';
        const firstTurn = session.conversationHistory[0];
        const preview = firstTurn.transcription || firstTurn.ai_response || 'Empty conversation';
        return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
    }

    function handleSessionClick(session) {
        setSelectedSession(session);
    }

    function handleBackClick() {
        setSelectedSession(null);
    }

    function handleTabClick(tab) {
        setActiveTab(tab);
    }

    function deleteSavedResponse(index) {
        const newArr = savedResponses.filter((_, i) => i !== index);
        setSavedResponses(newArr);
        localStorage.setItem('savedResponses', JSON.stringify(newArr));
    }

    function getProfileNames() {
        return {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
            exam: 'Exam Assistant',
        };
    }

    // Render helpers
    function renderSessionsList() {
        if (loading) return <div className="text-sm text-gray-400">Loading conversation history...</div>;
        if (!sessions || sessions.length === 0) {
            return (
                <div className="text-center mt-8 text-sm text-gray-400">
                    <div className="text-base font-semibold text-gray-100">No conversations yet</div>
                    <div className="mt-2">Start a session to see your conversation history here</div>
                </div>
            );
        }

        return (
            <div className="sessions-list space-y-2">
                {sessions.map((session) => (
                    <div
                        key={session.id || session.timestamp}
                        onClick={() => handleSessionClick(session)}
                        className="session-item bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-md p-3 cursor-pointer hover:bg-[rgba(255,255,255,0.03)]"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-semibold">{formatDate(session.timestamp)}</div>
                            <div className="text-[11px] text-gray-400">{formatTime(session.timestamp)}</div>
                        </div>
                        <div className="text-sm text-gray-300 leading-tight">{getSessionPreview(session)}</div>
                    </div>
                ))}
            </div>
        );
    }

    function renderSavedResponses() {
        if (!savedResponses || savedResponses.length === 0) {
            return (
                <div className="text-center mt-8 text-sm text-gray-400">
                    <div className="text-base font-semibold text-gray-100">No saved responses</div>
                    <div className="mt-2">Use the save button during conversations to save important responses</div>
                </div>
            );
        }

        const profileNames = getProfileNames();

        return (
            <div className="sessions-list space-y-3">
                {savedResponses.map((saved, index) => (
                    <div key={index} className="saved-response-item bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-xs font-semibold text-[rgba(255,255,255,0.9)]">{profileNames[saved.profile] || saved.profile}</div>
                                <div className="text-[11px] text-gray-400">{formatTimestamp(saved.timestamp)}</div>
                            </div>
                            <button onClick={() => deleteSavedResponse(index)} className="delete-button p-1 rounded hover:bg-[rgba(255,0,0,0.06)]">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-300">
                                    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="saved-response-content text-sm text-gray-100 leading-relaxed">{saved.response}</div>
                    </div>
                ))}
            </div>
        );
    }

    function renderConversationView() {
        if (!selectedSession) return null;

        const messages = [];
        const history = selectedSession.conversationHistory || [];
        history.forEach((turn) => {
            if (turn.transcription) messages.push({ type: 'user', content: turn.transcription, timestamp: turn.timestamp });
            if (turn.ai_response) messages.push({ type: 'ai', content: turn.ai_response, timestamp: turn.timestamp });
        });

        return (
            <div className="history-container h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={handleBackClick} className="back-button flex items-center gap-2 text-sm px-3 py-2 bg-transparent border border-[rgba(255,255,255,0.04)] rounded">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        Back to Sessions
                    </button>

                    <div className="legend flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-[#5865f2] inline-block" />
                            <span>Them</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-[#ed4245] inline-block" />
                            <span>Suggestion</span>
                        </div>
                    </div>
                </div>

                <div className="conversation-view flex-1 overflow-auto bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.04)] rounded p-3">
                    {messages.length > 0 ? (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`message mb-2 p-2 text-sm leading-relaxed rounded ${msg.type === 'user' ? 'border-l-4 border-[#5865f2] bg-[rgba(88,101,242,0.04)]' : 'border-l-4 border-[#ed4245] bg-[rgba(237,66,69,0.04)]'}`}>
                                {msg.content}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state text-center text-sm text-gray-400 mt-6">No conversation data available</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="history-container h-full">
            <style>{`
                /* Scrollbars */
                .sessions-list::-webkit-scrollbar, .conversation-view::-webkit-scrollbar { width: 6px; }
                .sessions-list::-webkit-scrollbar-track, .conversation-view::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 3px; }
                .sessions-list::-webkit-scrollbar-thumb, .conversation-view::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
                .sessions-list::-webkit-scrollbar-thumb:hover, .conversation-view::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
            `}</style>

            {selectedSession ? (
                renderConversationView()
            ) : (
                <div>
                    <div className="tabs-container flex gap-3 mb-4 border-b border-[rgba(255,255,255,0.04)] pb-2">
                        <button onClick={() => handleTabClick('sessions')} className={`tab px-3 py-1 rounded-t ${activeTab === 'sessions' ? 'bg-[rgba(255,255,255,0.02)] text-white border-b-2 border-[rgba(255,255,255,0.06)]' : 'text-gray-400'}`}>
                            Conversation History
                        </button>
                        <button onClick={() => handleTabClick('saved')} className={`tab px-3 py-1 rounded-t ${activeTab === 'saved' ? 'bg-[rgba(255,255,255,0.02)] text-white border-b-2 border-[rgba(255,255,255,0.06)]' : 'text-gray-400'}`}>
                            Saved Responses ({savedResponses.length})
                        </button>
                    </div>

                    <div className="min-h-[200px]">
                        {activeTab === 'sessions' ? renderSessionsList() : renderSavedResponses()}
                    </div>
                </div>
            )}
        </div>
    );
}
