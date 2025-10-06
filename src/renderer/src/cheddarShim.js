// Simple shim to provide a queued `window.cheddar` API until React mounts and installs real handlers.
(function () {
    const queue = [];
    let impl = null;

    function createQueueingHandler(name) {
        return function (...args) {
            if (impl && typeof impl[name] === 'function') {
                return impl[name](...args);
            }
            queue.push({ name, args });
        };
    }

    const apiNames = [
        'element',
        'e',
        'getCurrentView',
        'getLayoutMode',
        'setStatus',
        'setResponse',
        'initializeGemini',
        'startCapture',
        'stopCapture',
        'sendTextMessage',
        'handleShortcut',
        'getAllConversationSessions',
        'getConversationSession',
        'initConversationStorage',
        'getContentProtection',
        'isLinux',
        'isMacOS',
    ];

    const stub = {};
    apiNames.forEach(name => {
        stub[name] = createQueueingHandler(name);
    });

    window.cheddar = stub;

    window.__setCheddarImplementation = function (realImpl) {
        impl = realImpl || {};
        // set window.cheddar to the real implementation
        window.cheddar = impl;
        // replay queued calls
        while (queue.length) {
            const { name, args } = queue.shift();
            if (typeof impl[name] === 'function') {
                try {
                    impl[name](...args);
                } catch (e) {
                    console.error('Error replaying cheddar.' + name, e);
                }
            }
        }
    };
})();
