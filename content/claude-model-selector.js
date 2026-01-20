/**
 * Claude Model Selector Content Script
 * Attempts to select the desired model in Claude's UI
 * Designed to fail gracefully without breaking the extension
 */

(function() {
  'use strict';

  // Model ID mappings - Claude uses display names in UI
  const MODEL_DISPLAY_NAMES = {
    'opus-4.5': 'Opus 4.5',
    'sonnet-4.5': 'Sonnet 4.5',
    'haiku-4.5': 'Haiku 4.5'
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
    if (message.action === 'selectModel' && message.service === 'claude') {
      handleModelSelection(message.modelId)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ 
          success: false, 
          error: error.message,
          service: 'claude'
        }));
      return true; // Keep channel open for async response
    }
  });

  /**
   * Main handler for model selection
   */
  async function handleModelSelection(modelId) {
    console.log('[DualAI] Claude: Attempting to select model:', modelId);

    try {
      // Wait for page to be interactive
      await waitForPageReady();

      // Find and click the model selector button
      const selectorButton = await findModelSelectorButton();
      if (!selectorButton) {
        return { 
          success: false, 
          error: 'Model selector button not found',
          service: 'claude'
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
        return { 
          success: false, 
          error: `Model option "${modelId}" not found in dropdown`,
          service: 'claude'
        };
      }

      // Click the model option
      modelOption.click();
      await sleep(CONFIG.settleDelay);

      console.log('[DualAI] Claude: Successfully selected model:', modelId);
      return { 
        success: true, 
        service: 'claude',
        model: modelId
      };

    } catch (error) {
      console.error('[DualAI] Claude: Model selection failed:', error);
      return { 
        success: false, 
        error: error.message,
        service: 'claude'
      };
    }
  }

  /**
   * Wait for page to be ready for interaction
   */
  async function waitForPageReady() {
    const startTime = Date.now();
    
    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      // Check if main chat interface is loaded
      const chatContainer = document.querySelector(
        '[data-testid="chat-container"], ' +
        'main, ' +
        '.chat-container, ' +
        '[class*="conversation"], ' +
        '[class*="chat-input"]'
      );
      
      if (chatContainer) {
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
      // Primary: Use data-testid (most stable)
      const btn = document.querySelector('[data-testid="model-selector-dropdown"]');
      if (btn && isVisible(btn)) {
        console.log('[DualAI] Claude: Found model selector via data-testid');
        return btn;
      }

      await sleep(CONFIG.pollInterval);
    }

    return null;
  }

  /**
   * Find the model option in the dropdown
   */
  async function findModelOption(modelId) {
    const targetName = MODEL_DISPLAY_NAMES[modelId];
    if (!targetName) {
      console.error('[DualAI] Claude: Unknown model ID:', modelId);
      return null;
    }

    const startTime = Date.now();

    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      // Find all menu items
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      
      for (const item of menuItems) {
        if (!isVisible(item)) continue;
        
        // Get the text property - the inspector showed "text" contains just the model name
        const fontUi = item.querySelector('.font-ui');
        const itemText = fontUi?.textContent?.trim() || item.textContent?.split(/\n/)[0]?.trim() || '';
        
        if (itemText === targetName) {
          console.log('[DualAI] Claude: Found model option:', itemText);
          return item;
        }
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

  console.log('[DualAI] Claude model selector script loaded');
})();
