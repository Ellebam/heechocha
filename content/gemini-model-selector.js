/**
 * Gemini Model Selector Content Script
 */

(function () {
  'use strict';

  const MODEL_TEST_IDS = {
    'fast': 'bard-mode-option-fast',
    'thinking': 'bard-mode-option-thinking',
    'pro': 'bard-mode-option-pro'
  };

  const CONFIG = {
    maxWaitTime: 10000,
    pollInterval: 300,
    clickDelay: 300,
    settleDelay: 600
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.service !== 'gemini') return;

    if (message.action === 'selectModel') {
      selectModel(message.modelId)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message, service: 'gemini' }));
      return true;
    }

    if (message.action === 'insertPrompt') {
      insertPrompt(message.prompt)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message, service: 'gemini' }));
      return true;
    }
  });

  async function selectModel(modelId) {
    console.log('[DualAI] Gemini: Selecting model:', modelId);

    const testId = MODEL_TEST_IDS[modelId];
    if (!testId) {
      return { success: true, message: 'Default model, skipping', service: 'gemini' };
    }

    try {
      await waitForPageReady();

      // Find the mode menu button
      const btn = document.querySelector('[data-test-id="bard-mode-menu-button"] button') ||
        document.querySelector('[data-test-id="bard-mode-menu-button"]') ||
        document.querySelector('button[aria-label*="model"]');

      if (!btn) {
        // Model selector might be hidden for some accounts
        return { success: false, error: 'Model selector not found (may be unavailable)', service: 'gemini' };
      }

      btn.click();
      await sleep(CONFIG.clickDelay);

      // Find and click the option
      const option = document.querySelector(`[data-test-id="${testId}"]`);
      if (option) {
        option.click();
        await sleep(CONFIG.settleDelay);
        console.log('[DualAI] Gemini: Model selected');
        return { success: true, service: 'gemini' };
      }

      // Close menu if option not found
      document.body.click();
      return { success: false, error: 'Model option not found', service: 'gemini' };

    } catch (error) {
      console.error('[DualAI] Gemini error:', error);
      return { success: false, error: error.message, service: 'gemini' };
    }
  }

  async function insertPrompt(text) {
    console.log('[DualAI] Gemini: Inserting prompt');

    try {
      await waitForPageReady();

      // Gemini input is a contenteditable div, often inside rich-textarea
      const editor = document.querySelector('.ql-editor[contenteditable="true"]') ||
        document.querySelector('.rich-textarea [contenteditable="true"]') ||
        document.querySelector('[contenteditable="true"][aria-label*="prompt"]') ||
        document.querySelector('[contenteditable="true"]');

      if (!editor) {
        return { success: false, error: 'Gemini input not found', service: 'gemini' };
      }

      editor.focus();
      await sleep(100);

      // Clear and insert
      editor.innerHTML = '';

      // Fallback to direct manipulation with multiline support
      if (!editor.textContent) {
        // Replace newlines with <br> for contenteditable
        const htmlContent = text.replace(/\n/g, '<br>');

        // Focus and select all to ensure clean insertion
        editor.focus();

        // Use insertHTML to preserve line breaks
        const success = document.execCommand('insertHTML', false, htmlContent);

        if (!success) {
          // If execCommand fails, try direct innerHTML (less ideal but works)
          editor.innerHTML = htmlContent;
        }

        // Trigger input event to notify React/Framework
        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
      }

      console.log('[DualAI] Gemini: Prompt inserted');
      return { success: true, service: 'gemini' };

    } catch (error) {
      console.error('[DualAI] Gemini prompt error:', error);
      return { success: false, error: error.message, service: 'gemini' };
    }
  }

  async function waitForPageReady() {
    const startTime = Date.now();

    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      const editor = document.querySelector('[contenteditable="true"]');
      if (editor && isVisible(editor)) {
        await sleep(CONFIG.settleDelay);
        return true;
      }
      await sleep(CONFIG.pollInterval);
    }

    throw new Error('Page did not become ready');
  }

  function isVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  console.log('[DualAI] Gemini content script loaded');
})();