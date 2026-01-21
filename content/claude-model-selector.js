/**
 * Claude Model Selector Content Script
 * Updated for current Claude UI (2025)
 */

(function() {
  'use strict';

  // Model display names - match exactly what Claude shows
  const MODEL_DISPLAY_NAMES = {
    'opus-4.5': ['Opus 4.5', 'Opus'],
    'sonnet-4.5': ['Sonnet 4.5', 'Sonnet'],
    'haiku-4.5': ['Haiku 4.5', 'Haiku']
  };

  const CONFIG = {
    maxWaitTime: 10000,
    pollInterval: 300,
    clickDelay: 300,
    settleDelay: 600
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.service !== 'claude') return;

    if (message.action === 'selectModel') {
      handleModelSelection(message.modelId)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message, service: 'claude' }));
      return true;
    }

    if (message.action === 'insertPrompt') {
      handlePromptInsertion(message.prompt)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message, service: 'claude' }));
      return true;
    }
  });

  async function handleModelSelection(modelId) {
    console.log('[DualAI] Claude: Selecting model:', modelId);

    const targetNames = MODEL_DISPLAY_NAMES[modelId];
    if (!targetNames) {
      return { success: true, message: 'Unknown model, skipping' };
    }

    try {
      await waitForPageReady();

      // Strategy 1: Look for data-testid
      let selectorBtn = document.querySelector('[data-testid="model-selector-dropdown"]');
      
      // Strategy 2: Find button containing model keywords
      if (!selectorBtn) {
        const buttons = Array.from(document.querySelectorAll('button'));
        selectorBtn = buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('sonnet') || text.includes('opus') || text.includes('haiku');
        });
      }

      // Strategy 3: Look for dropdown trigger near input area
      if (!selectorBtn) {
        const inputArea = document.querySelector('[contenteditable="true"]');
        if (inputArea) {
          const container = inputArea.closest('form') || inputArea.parentElement?.parentElement?.parentElement;
          if (container) {
            selectorBtn = container.querySelector('button');
          }
        }
      }

      if (!selectorBtn) {
        return { success: false, error: 'Model selector button not found', service: 'claude' };
      }

      // Check if already selected
      const currentText = selectorBtn.textContent || '';
      if (targetNames.some(name => currentText.includes(name))) {
        console.log('[DualAI] Claude: Model already selected');
        return { success: true, message: 'Already selected', service: 'claude' };
      }

      // Click to open dropdown
      selectorBtn.click();
      await sleep(CONFIG.clickDelay);

      // Find the model option
      const option = await findModelOption(targetNames);
      if (!option) {
        // Close dropdown
        document.body.click();
        return { success: false, error: 'Model option not found in dropdown', service: 'claude' };
      }

      option.click();
      await sleep(CONFIG.settleDelay);

      console.log('[DualAI] Claude: Model selected successfully');
      return { success: true, service: 'claude', model: modelId };

    } catch (error) {
      console.error('[DualAI] Claude error:', error);
      return { success: false, error: error.message, service: 'claude' };
    }
  }

  async function findModelOption(targetNames) {
    const startTime = Date.now();

    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      // Look for menu items
      const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"], [role="menuitemradio"]');
      
      for (const item of menuItems) {
        if (!isVisible(item)) continue;
        
        const itemText = item.textContent?.trim() || '';
        
        // Check if any target name matches
        for (const name of targetNames) {
          if (itemText.includes(name)) {
            // Avoid upgrade/subscribe buttons
            if (itemText.toLowerCase().includes('upgrade') || itemText.toLowerCase().includes('subscribe')) {
              continue;
            }
            return item;
          }
        }
      }

      await sleep(CONFIG.pollInterval);
    }

    return null;
  }

  async function handlePromptInsertion(text) {
    console.log('[DualAI] Claude: Inserting prompt');

    try {
      await waitForPageReady();

      // Find the input area - Claude uses contenteditable
      const inputArea = document.querySelector('[contenteditable="true"]');
      if (!inputArea) {
        return { success: false, error: 'Chat input not found', service: 'claude' };
      }

      // Focus the input
      inputArea.focus();
      await sleep(100);

      // Clear existing content
      inputArea.innerHTML = '';

      // Insert text using execCommand for better React compatibility
      document.execCommand('insertText', false, text);

      // If execCommand didn't work, try direct manipulation
      if (!inputArea.textContent) {
        const p = document.createElement('p');
        p.textContent = text;
        inputArea.appendChild(p);

        // Dispatch input event
        inputArea.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
      }

      console.log('[DualAI] Claude: Prompt inserted');
      return { success: true, service: 'claude' };

    } catch (error) {
      console.error('[DualAI] Claude prompt error:', error);
      return { success: false, error: error.message, service: 'claude' };
    }
  }

  async function waitForPageReady() {
    const startTime = Date.now();
    
    while (Date.now() - startTime < CONFIG.maxWaitTime) {
      const inputArea = document.querySelector('[contenteditable="true"]');
      if (inputArea && isVisible(inputArea)) {
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  console.log('[DualAI] Claude content script loaded');
})();