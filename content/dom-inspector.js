/**
 * DOM Inspector for AI Chat Interfaces
 * Scans the page and extracts structured information about interactive elements
 * Designed to help identify selectors for model dropdowns, chat inputs, etc.
 */

(function() {
  'use strict';

  // Listen for inspection requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'inspectDOM') {
      const result = inspectPage();
      sendResponse(result);
    }
    return true;
  });

  /**
   * Main inspection function
   */
  function inspectPage() {
    const url = window.location.href;
    const service = detectService(url);
    
    const result = {
      meta: {
        url: url,
        service: service,
        timestamp: new Date().toISOString(),
        title: document.title
      },
      summary: {
        totalInteractive: 0,
        buttons: 0,
        inputs: 0,
        dropdowns: 0,
        menus: 0
      },
      likelyControls: {
        modelSelector: null,
        chatInput: null,
        submitButton: null,
        fileUpload: null
      },
      elements: {
        buttons: [],
        inputs: [],
        dropdowns: [],
        menus: [],
        menuItems: [],
        ariaElements: []
      },
      rawStructure: null
    };

    // Scan all interactive elements
    scanButtons(result);
    scanInputs(result);
    scanDropdowns(result);
    scanMenus(result);
    scanAriaElements(result);
    
    // Try to identify likely controls
    identifyLikelyControls(result, service);
    
    // Get focused area structure (around chat input)
    result.rawStructure = getChatAreaStructure();
    
    // Update summary
    result.summary.totalInteractive = 
      result.summary.buttons + 
      result.summary.inputs + 
      result.summary.dropdowns + 
      result.summary.menus;

    return result;
  }

  /**
   * Detect which AI service we're on
   */
  function detectService(url) {
    if (url.includes('claude.ai')) return 'claude';
    if (url.includes('gemini.google.com')) return 'gemini';
    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) return 'chatgpt';
    return 'unknown';
  }

  /**
   * Scan all buttons
   */
  function scanButtons(result) {
    const buttons = document.querySelectorAll('button, [role="button"]');
    
    buttons.forEach(btn => {
      if (!isVisible(btn)) return;
      
      const info = extractElementInfo(btn);
      info.type = 'button';
      
      // Check for model-related content
      const text = (info.text + ' ' + info.ariaLabel).toLowerCase();
      if (text.includes('model') || text.includes('opus') || text.includes('sonnet') || 
          text.includes('haiku') || text.includes('gemini') || text.includes('gpt') ||
          text.includes('thinking') || text.includes('flash') || text.includes('pro')) {
        info.likelyPurpose = 'model-selector';
      }
      
      // Check for submit-related
      if (text.includes('send') || text.includes('submit') || info.ariaLabel?.includes('send')) {
        info.likelyPurpose = 'submit';
      }
      
      result.elements.buttons.push(info);
      result.summary.buttons++;
    });
  }

  /**
   * Scan all inputs and textareas
   */
  function scanInputs(result) {
    const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    
    inputs.forEach(input => {
      if (!isVisible(input)) return;
      
      const info = extractElementInfo(input);
      info.type = input.tagName.toLowerCase();
      info.inputType = input.type || null;
      info.placeholder = input.placeholder || null;
      info.isContentEditable = input.contentEditable === 'true';
      
      // Check for chat input
      const text = (info.placeholder + ' ' + info.ariaLabel + ' ' + info.classes).toLowerCase();
      if (text.includes('message') || text.includes('prompt') || text.includes('chat') || 
          text.includes('reply') || text.includes('ask')) {
        info.likelyPurpose = 'chat-input';
      }
      
      result.elements.inputs.push(info);
      result.summary.inputs++;
    });
  }

  /**
   * Scan dropdowns and selects
   */
  function scanDropdowns(result) {
    const selects = document.querySelectorAll('select, [role="listbox"], [role="combobox"]');
    
    selects.forEach(select => {
      if (!isVisible(select)) return;
      
      const info = extractElementInfo(select);
      info.type = 'dropdown';
      
      // Get options if it's a select
      if (select.tagName === 'SELECT') {
        info.options = Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.textContent.trim()
        }));
      }
      
      result.elements.dropdowns.push(info);
      result.summary.dropdowns++;
    });
  }

  /**
   * Scan menus and menu items
   */
  function scanMenus(result) {
    const menus = document.querySelectorAll('[role="menu"], [role="menubar"]');
    
    menus.forEach(menu => {
      const info = extractElementInfo(menu);
      info.type = 'menu';
      info.items = [];
      
      // Get menu items
      const items = menu.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]');
      items.forEach(item => {
        const itemInfo = extractElementInfo(item);
        itemInfo.type = 'menuitem';
        info.items.push(itemInfo);
        result.elements.menuItems.push(itemInfo);
      });
      
      result.elements.menus.push(info);
      result.summary.menus++;
    });

    // Also scan standalone menu items (when dropdown is open)
    const standaloneItems = document.querySelectorAll('[role="menuitem"]:not([role="menu"] [role="menuitem"])');
    standaloneItems.forEach(item => {
      if (!isVisible(item)) return;
      const itemInfo = extractElementInfo(item);
      itemInfo.type = 'menuitem-standalone';
      
      // Look for model names
      const text = itemInfo.text.toLowerCase();
      if (text.includes('opus') || text.includes('sonnet') || text.includes('haiku') ||
          text.includes('flash') || text.includes('thinking') || text.includes('pro')) {
        itemInfo.likelyPurpose = 'model-option';
      }
      
      result.elements.menuItems.push(itemInfo);
    });
  }

  /**
   * Scan elements with ARIA attributes
   */
  function scanAriaElements(result) {
    const ariaElements = document.querySelectorAll('[aria-haspopup], [aria-expanded], [aria-controls]');
    
    ariaElements.forEach(el => {
      if (!isVisible(el)) return;
      
      const info = extractElementInfo(el);
      info.ariaHaspopup = el.getAttribute('aria-haspopup');
      info.ariaExpanded = el.getAttribute('aria-expanded');
      info.ariaControls = el.getAttribute('aria-controls');
      
      result.elements.ariaElements.push(info);
    });
  }

  /**
   * Extract comprehensive info from an element
   */
  function extractElementInfo(el) {
    // Get text content, but clean it up
    let text = '';
    
    // Try to get the most specific text first
    const fontUi = el.querySelector('.font-ui');
    if (fontUi) {
      text = fontUi.textContent.trim();
    } else {
      // Get direct text, not nested
      text = getDirectText(el);
    }
    
    // Fallback to full text content if empty
    if (!text) {
      text = el.textContent?.trim().substring(0, 100) || '';
    }

    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: el.className?.toString() || null,
      text: text,
      fullText: el.textContent?.trim().substring(0, 200) || '',
      dataTestId: el.getAttribute('data-testid') || null,
      dataAttributes: getDataAttributes(el),
      ariaLabel: el.getAttribute('aria-label') || null,
      ariaRole: el.getAttribute('role') || null,
      selector: generateSelector(el),
      innerStructure: getInnerStructure(el),
      likelyPurpose: null
    };
  }

  /**
   * Get direct text content (not from children)
   */
  function getDirectText(el) {
    let text = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent.trim() + ' ';
      }
    }
    return text.trim();
  }

  /**
   * Get all data-* attributes
   */
  function getDataAttributes(el) {
    const data = {};
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-')) {
        data[attr.name] = attr.value;
      }
    }
    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Generate a useful CSS selector for the element
   */
  function generateSelector(el) {
    // Prioritize stable selectors
    if (el.getAttribute('data-testid')) {
      return `[data-testid="${el.getAttribute('data-testid')}"]`;
    }
    
    if (el.id) {
      return `#${el.id}`;
    }
    
    // Try aria-label
    if (el.getAttribute('aria-label')) {
      return `[aria-label="${el.getAttribute('aria-label')}"]`;
    }
    
    // Fallback to tag + classes (first few)
    const tag = el.tagName.toLowerCase();
    const classes = el.className?.toString().split(' ').slice(0, 3).join('.') || '';
    
    if (classes) {
      return `${tag}.${classes}`;
    }
    
    return tag;
  }

  /**
   * Get simplified inner structure of an element
   */
  function getInnerStructure(el, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return '...';
    
    const children = Array.from(el.children);
    if (children.length === 0) {
      const text = el.textContent?.trim();
      return text ? `"${text.substring(0, 50)}"` : null;
    }
    
    return children.slice(0, 5).map(child => {
      const tag = child.tagName.toLowerCase();
      const cls = child.className?.toString().split(' ')[0] || '';
      const text = child.textContent?.trim().substring(0, 30);
      const inner = getInnerStructure(child, depth + 1, maxDepth);
      
      let repr = `<${tag}${cls ? '.' + cls : ''}>`;
      if (inner && typeof inner === 'string' && inner.startsWith('"')) {
        repr += inner;
      } else if (inner && Array.isArray(inner)) {
        repr += `[${inner.length} children]`;
      }
      
      return repr;
    });
  }

  /**
   * Try to identify likely controls based on the scan
   */
  function identifyLikelyControls(result, service) {
    // Find model selector
    const modelButtons = result.elements.buttons.filter(b => b.likelyPurpose === 'model-selector');
    if (modelButtons.length > 0) {
      result.likelyControls.modelSelector = modelButtons[0];
    } else {
      // Check aria elements with haspopup that contain model names
      const modelAria = result.elements.ariaElements.find(e => {
        const text = (e.text + ' ' + e.fullText).toLowerCase();
        return (text.includes('opus') || text.includes('sonnet') || text.includes('haiku') ||
                text.includes('gemini') || text.includes('flash') || text.includes('thinking'));
      });
      if (modelAria) {
        result.likelyControls.modelSelector = modelAria;
      }
    }
    
    // Find chat input
    const chatInputs = result.elements.inputs.filter(i => i.likelyPurpose === 'chat-input');
    if (chatInputs.length > 0) {
      result.likelyControls.chatInput = chatInputs[0];
    } else {
      // Fallback: largest textarea or contenteditable
      const textareas = result.elements.inputs.filter(i => i.type === 'textarea' || i.isContentEditable);
      if (textareas.length > 0) {
        result.likelyControls.chatInput = textareas[0];
      }
    }
    
    // Find submit button
    const submitButtons = result.elements.buttons.filter(b => b.likelyPurpose === 'submit');
    if (submitButtons.length > 0) {
      result.likelyControls.submitButton = submitButtons[0];
    }
    
    // Find file upload
    const fileInputs = result.elements.inputs.filter(i => i.inputType === 'file');
    if (fileInputs.length > 0) {
      result.likelyControls.fileUpload = fileInputs[0];
    }
  }

  /**
   * Get structure around the chat input area
   */
  function getChatAreaStructure() {
    // Try to find the main chat/input area
    const selectors = [
      'main',
      '[class*="chat"]',
      '[class*="conversation"]',
      '[class*="input-area"]',
      'form'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        return {
          selector: selector,
          html: el.outerHTML.substring(0, 5000) // Limit size
        };
      }
    }
    
    return null;
  }

  /**
   * Check if element is visible
   */
  function isVisible(el) {
    if (!el) return false;
    
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0;
  }

  console.log('[DualAI] DOM Inspector script loaded');
})();