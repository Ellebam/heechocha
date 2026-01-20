/**
 * Gemini Model Selector Content Script
 * Attempts to select the desired model in Gemini's UI
 * Designed to fail gracefully without breaking the extension
 */

/**
 * Gemini Controller
 */

(function() {
  'use strict';

  const MODEL_TEST_IDS = {
    'fast': 'bard-mode-option-fast',
    'thinking': 'bard-mode-option-thinking',
    'pro': 'bard-mode-option-pro'
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.service !== 'gemini') return;

    if (message.action === 'selectModel') {
      selectModel(message.modelId)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (message.action === 'insertPrompt') {
      insertPrompt(message.prompt)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });

  async function selectModel(modelId) {
    const testId = MODEL_TEST_IDS[modelId];
    if (!testId) return { success: true }; // Default or unknown

    // Try to find the mode menu button
    const btn = document.querySelector('[data-test-id="bard-mode-menu-button"] button') ||
                document.querySelector('[data-test-id="bard-mode-menu-button"]');
                
    if (!btn) return { success: false, error: 'Selector not found' }; // Might be hidden on some accounts

    btn.click();
    await sleep(300);

    const option = document.querySelector(`[data-test-id="${testId}"]`);
    if (option) {
      option.click();
      return { success: true };
    }
    
    document.body.click(); // Close
    throw new Error('Model option not found');
  }

  async function insertPrompt(text) {
    // Gemini input is a contenteditable div inside rich-textarea
    const editor = document.querySelector('.rich-textarea [contenteditable="true"]');
    if (!editor) throw new Error('Gemini input not found');

    editor.focus();
    
    // Gemini often puts text in a <p>
    editor.innerHTML = `<p>${text}</p>`;

    // Dispatch input event
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    });
    editor.dispatchEvent(inputEvent);

    return { success: true };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  console.log('[DualAI] Gemini model selector script loaded');
})();
