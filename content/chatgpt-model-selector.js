/**
 * ChatGPT Model Selector Content Script
 */

(function () {
    'use strict';

    const CONFIG = {
        maxWaitTime: 10000,
        pollInterval: 300,
        clickDelay: 300,
        settleDelay: 600
    };

    // Note: ChatGPT often handles model selection via URL query param ?model=gpt-4o
    // But we can also try to select via DOM if needed, or if URL param isn't enough.
    // For now, prompt insertion is the critical part.

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.service !== 'chatgpt') return;

        if (message.action === 'selectModel') {
            // Model selection logic here if we want dom-based selection
            // For now we might rely on URL params, but let's report success.
            selectModel(message.modelId)
                .then(res => sendResponse(res))
                .catch(err => sendResponse({ success: false, error: err.message, service: 'chatgpt' }));
            return true;
        }

        if (message.action === 'insertPrompt') {
            insertPrompt(message.prompt)
                .then(res => sendResponse(res))
                .catch(err => sendResponse({ success: false, error: err.message, service: 'chatgpt' }));
            return true;
        }

        if (message.action === 'inspectDOM') {
            // Optional: Add inspection logic if we want to re-use inspector
            return true;
        }
    });

    async function selectModel(modelId) {
        console.log('[DualAI] ChatGPT: Selecting model:', modelId);
        // Since we open the tab with ?model=modelId, we might not need to do anything here.
        // However, if the user navigates or if we want to switch mid-stream, we'd need DOM logic.
        // For V1.1, we'll assume the URL param handled it (handled in background script url builder).
        // We just return success to satisfy the handshake.

        return { success: true, service: 'chatgpt', message: 'Model set via URL' };
    }

    async function insertPrompt(text) {
        console.log('[DualAI] ChatGPT: Inserting prompt');

        try {
            await waitForPageReady();

            // Find the input (textarea or contenteditable div)
            const input = document.querySelector('#prompt-textarea') ||
                document.querySelector('div[contenteditable="true"]');

            if (!input) {
                return { success: false, error: 'ChatGPT input not found', service: 'chatgpt' };
            }

            input.focus();
            await sleep(100);

            if (input.tagName === 'TEXTAREA') {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                // For contenteditable div
                input.innerHTML = `<p>${text}</p>`; // Simple check, usually <p> works for GPT
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            console.log('[DualAI] ChatGPT: Prompt inserted');
            return { success: true, service: 'chatgpt' };

        } catch (error) {
            console.error('[DualAI] ChatGPT prompt error:', error);
            return { success: false, error: error.message, service: 'chatgpt' };
        }
    }

    async function waitForPageReady() {
        const startTime = Date.now();

        while (Date.now() - startTime < CONFIG.maxWaitTime) {
            const input = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
            if (input) {
                return true;
            }
            await sleep(CONFIG.pollInterval);
        }

        throw new Error('Page did not become ready');
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    console.log('[DualAI] ChatGPT content script loaded');
})();
