/**
 * Claude Controller (Model Selection + Prompt Injection)
 */

(function() {
  'use strict';

  const MODEL_MAPPING = {
    'opus-4.5': ['Opus', '3.5 Opus'], // Fallback keywords
    'sonnet-4.5': ['Sonnet', '3.5 Sonnet'],
    'haiku-4.5': ['Haiku', '3 Haiku']
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.service !== 'claude') return;

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
    const keywords = MODEL_MAPPING[modelId];
    if (!keywords) return { success: true }; // Unknown model, skip

    // 1. Find the trigger button. 
    // It usually displays the current model name or text like "Model"
    const triggers = Array.from(document.querySelectorAll('button, [role="button"]'))
      .filter(b => {
        const txt = b.textContent.toLowerCase();
        // Avoid the "New Chat" button or "Subscribe" buttons
        return (txt.includes('sonnet') || txt.includes('opus') || txt.includes('haiku') || txt.includes('model'));
      });

    // Strategy: If we find a button that already says our model name, we are done.
    const alreadySelected = triggers.find(t => keywords.some(k => t.textContent.includes(k)));
    if (alreadySelected) return { success: true, message: 'Already selected' };

    // Otherwise, click the most likely model selector (usually the one in the chat controls)
    // Filter for buttons near the top or specifically styled
    const selectorBtn = document.querySelector('[data-testid="model-selector-dropdown"]') || triggers[0];
    
    if (!selectorBtn) throw new Error('Could not find model selector');
    
    selectorBtn.click();
    await sleep(500);

    // 2. Find option in menu
    const options = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], button'));
    const targetOption = options.find(opt => 
      keywords.some(k => opt.textContent.includes(k)) && 
      !opt.textContent.includes('Upgrade') // Avoid upsell buttons
    );

    if (targetOption) {
      targetOption.click();
      return { success: true };
    }
    
    // Close menu if failed
    document.body.click();
    throw new Error(`Model option for ${modelId} not found`);
  }

  async function insertPrompt(text) {
    // Claude uses a contenteditable div with a <p> inside
    const inputArea = document.querySelector('[contenteditable="true"]');
    if (!inputArea) throw new Error('Chat input not found');

    // Focus first
    inputArea.focus();
    
    // Clear existing (usually just a <p><br></p>)
    inputArea.innerHTML = '';
    
    // Create paragraph structure
    const p = document.createElement('p');
    p.textContent = text;
    inputArea.appendChild(p);

    // Dispatch events to trigger React state updates
    const events = ['input', 'change'];
    events.forEach(eventType => {
        const e = new Event(eventType, { bubbles: true, cancelable: true });
        inputArea.dispatchEvent(e);
    });

    // Move cursor to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(inputArea);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    return { success: true };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
})();

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Dual AI Chat Launcher installed');
  } else if (details.reason === 'update') {
    console.log('Dual AI Chat Launcher updated to version', chrome.runtime.getManifest().version);
  }
});
