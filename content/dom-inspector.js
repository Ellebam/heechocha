/**
 * DOM Inspector for AI Chat Interfaces
 * Scans the page and extracts structured information about interactive elements
 * Designed to help identify selectors for model dropdowns, chat inputs, etc.
 */

/**
 * DOM Inspector - Optimized for Stability
 */
(function() {
  'use strict';

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'inspectDOM') {
      try {
        const result = inspectPage();
        sendResponse(result);
      } catch (e) {
        sendResponse({ error: e.toString() });
      }
    }
    return true;
  });

  function inspectPage() {
    const url = window.location.href;
    const service = url.includes('claude') ? 'claude' : (url.includes('gemini') ? 'gemini' : 'unknown');
    
    const result = {
      meta: { url, service, timestamp: new Date().toISOString() },
      summary: { buttons: 0, inputs: 0 },
      likelyControls: { modelSelector: null, chatInput: null },
      elements: { buttons: [], inputs: [] } // Reduced scope
    };

    // Scan Buttons (Limit to top 50 to avoid payload bloat)
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).slice(0, 50);
    buttons.forEach(btn => {
      if (!isVisible(btn)) return;
      
      const text = (btn.textContent || '').trim().substring(0, 50);
      const label = btn.getAttribute('aria-label') || '';
      
      const info = {
        tag: btn.tagName.toLowerCase(),
        text: text,
        label: label,
        testid: btn.getAttribute('data-testid') || btn.getAttribute('data-test-id'),
        selector: generateSelector(btn)
      };
      
      // Heuristic detection
      const content = (text + ' ' + label).toLowerCase();
      if (content.includes('model') || content.includes('sonnet') || content.includes('opus')) {
        info.likelyPurpose = 'model-selector';
        if (!result.likelyControls.modelSelector) result.likelyControls.modelSelector = info;
      }

      result.elements.buttons.push(info);
      result.summary.buttons++;
    });

    // Scan Inputs
    const inputs = document.querySelectorAll('textarea, [contenteditable="true"]');
    inputs.forEach(inp => {
      if (!isVisible(inp)) return;
      const info = {
        tag: inp.tagName.toLowerCase(),
        contentEditable: inp.getAttribute('contenteditable'),
        placeholder: inp.getAttribute('placeholder') || inp.getAttribute('aria-placeholder'),
        selector: generateSelector(inp)
      };
      
      if (!result.likelyControls.chatInput) result.likelyControls.chatInput = info;
      result.elements.inputs.push(info);
      result.summary.inputs++;
    });

    return result;
  }

  function generateSelector(el) {
    if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    if (el.getAttribute('data-test-id')) return `[data-test-id="${el.getAttribute('data-test-id')}"]`;
    if (el.id) return `#${el.id}`;
    if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;
    return el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : '');
  }

  function isVisible(el) {
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  }

  console.log('[DualAI] DOM Inspector script loaded');
})();