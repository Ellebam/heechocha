/**
 * Gemini Model Selector Content Script
 * Attempts to select the desired model in Gemini's UI
 * Designed to fail gracefully without breaking the extension
 */

(function() {
  'use strict';

  // Gemini uses data-test-id attributes for model options
  const MODEL_TEST_IDS = {
    'fast': 'bard-mode-option-fast',
    'thinking': 'bard-mode-option-thinking',
    'pro': 'bard-mode-option-pro'
  };

  // Configuration
  const CONFIG = {
    maxWaitTime: 8000,      // Maximum time to wait for UI elements
    pollInterval: 300,      // How often to check for elements
    clickDelay: 200,        // Delay between clicks
    settleDelay: 500        // Time to let UI settle after actions
  };

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'selectModel' && message.service === 'gemini') {
      handleModelSelection(message.modelId)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ 
          success: false, 
          error: error.message,
          service: 'gemini'
        }));
      return true; // Keep channel open for async response
    }
  });

  /**
   * Main handler for model selection
   */
  async function handleModelSelection(modelId) {
    console.log('[DualAI] Gemini: Attempting to select model:', modelId);

    try {
      // Wait for page to be interactive
      await waitForPageReady();

      // Find and click the model selector button
      const selectorButton = await findModelSelectorButton();
      if (!selectorButton) {
        return { 
          success: false, 
          error: 'Model selector button not found',
          service: 'gemini'
        };
      }

      // Click to open dropdown
      selectorButton.click();
      await sleep(CONFIG.clickDelay);

      // Wait for dropdown to appear and find the option
      const modelOption = await findModelOption(modelId);
      if (!modelOption) {
        // Try to close dropdown before returning
        document.body.click();
        await sleep(100);
        // Press Escape as backup
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        
        return { 
          success: false, 
          error: `Model option "${modelId}" not found in dropdown`,
          service: 'gemini'
        };
      }

      // Click the model option
      modelOption.click();
      await sleep(CONFIG.settleDelay);

      console.log('[DualAI] Gemini: Successfully selected model:', modelId);
      return { 
        success: true, 
        service: 'gemini',
        model: modelId
      };

    } catch (error) {
      console.error('[DualAI] Gemini: Model selection failed:', error);
      return { 
        success: false, 
        error: error.message,
        service: 'gemini'
      };
    }
  }

  /**
   * Wait for page to be ready for interaction
   */
  async function waitForPageReady() {
    const startTime = Date.now();
    
    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      // Check if main chat interface is loaded - Gemini specific elements
      const chatReady = document.querySelector(
        'textarea, ' +
        '[contenteditable="true"], ' +
        '[class*="input-area"], ' +
        '[class*="chat-input"], ' +
        '[class*="prompt"]'
      );
      
      if (chatReady) {
        await sleep(CONFIG.settleDelay);
        return true;
      }
      
      await sleep(CONFIG.pollInterval);
    }
    
    throw new Error('Page did not become ready in time');
  }

  /**
   * Find the model selector button
   */
  async function findModelSelectorButton() {
    const startTime = Date.now();

    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      // Primary: Use data-test-id for the mode menu button
      const btn = document.querySelector('[data-test-id="bard-mode-menu-button"]');
      if (btn && isVisible(btn)) {
        console.log('[DualAI] Gemini: Found model selector via data-test-id');
        // Click the inner button or the container
        const innerBtn = btn.querySelector('button') || btn;
        return innerBtn;
      }

      // Fallback: button with class input-area-switch
      const fallback = document.querySelector('button.input-area-switch');
      if (fallback && isVisible(fallback)) {
        console.log('[DualAI] Gemini: Found model selector via input-area-switch class');
        return fallback;
      }

      await sleep(CONFIG.pollInterval);
    }

    return null;
  }

  /**
   * Find the model option in the dropdown
   */
  async function findModelOption(modelId) {
    const testId = MODEL_TEST_IDS[modelId];
    if (!testId) {
      console.error('[DualAI] Gemini: Unknown model ID:', modelId);
      return null;
    }

    const startTime = Date.now();

    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      // Use the specific data-test-id for each model option
      const option = document.querySelector(`[data-test-id="${testId}"]`);
      if (option && isVisible(option)) {
        console.log('[DualAI] Gemini: Found model option via data-test-id:', testId);
        return option;
      }

      await sleep(CONFIG.pollInterval);
    }

    return null;
  }

  /**
   * Check if element is visible
   */
  function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' 
      && style.visibility !== 'hidden' 
      && style.opacity !== '0'
      && rect.width > 0 
      && rect.height > 0;
  }

  /**
   * Sleep utility
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  console.log('[DualAI] Gemini model selector script loaded');
})();
