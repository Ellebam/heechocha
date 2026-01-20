/**
 * Background Service Worker
 * Handles tab creation, model selection, and cross-component messaging
 */

import { getStorage, getSettings, getDefaultGeminiAccountIndex } from '../lib/storage.js';
import { buildClaudeUrl, buildGeminiUrl } from '../lib/url-builder.js';

// Track pending model selections
const pendingModelSelections = new Map();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'launchChats') {
    handleLaunchChats(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'copyToClipboard') {
    handleCopyToClipboard(message.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'getModelSelectionStatus') {
    sendResponse({ pending: pendingModelSelections.size });
    return false;
  }
});

/**
 * Handle launching chat tabs
 */
async function handleLaunchChats(data) {
  const { 
    prompt, 
    claudeEnabled, 
    geminiEnabled, 
    claudeProjectId, 
    geminiGemId, 
    geminiAccountIndex,
    claudeModel,
    geminiModel 
  } = data;
  
  const results = {
    success: true,
    tabsOpened: [],
    modelSelections: [],
    errors: []
  };
  
  const { preferences } = await getStorage();
  const tabIds = [];
  
  try {
    // Open Claude tab if enabled
    if (claudeEnabled) {
      const claudeUrl = buildClaudeUrl(claudeProjectId);
      const claudeTab = await chrome.tabs.create({ 
        url: claudeUrl,
        active: false 
      });
      tabIds.push(claudeTab.id);
      results.tabsOpened.push({ 
        service: 'claude', 
        url: claudeUrl, 
        tabId: claudeTab.id 
      });

      // Queue model selection for Claude
      if (claudeModel) {
        queueModelSelection(claudeTab.id, 'claude', claudeModel, results);
      }
    }
    
    // Open Gemini tab if enabled
    if (geminiEnabled) {
      // Get account index from gem or default
      let accountIdx = geminiAccountIndex;
      if (accountIdx === null || accountIdx === undefined) {
        accountIdx = await getDefaultGeminiAccountIndex();
      }
      
      const geminiUrl = buildGeminiUrl(geminiGemId, accountIdx);
      const geminiTab = await chrome.tabs.create({ 
        url: geminiUrl,
        active: false 
      });
      tabIds.push(geminiTab.id);
      results.tabsOpened.push({ 
        service: 'gemini', 
        url: geminiUrl, 
        tabId: geminiTab.id 
      });

      // Queue model selection for Gemini
      if (geminiModel) {
        queueModelSelection(geminiTab.id, 'gemini', geminiModel, results);
      }
    }
    
    // Group tabs if preference is set and we have multiple tabs
    if (preferences.groupTabs && tabIds.length > 1) {
      try {
        const group = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(group, { 
          title: 'AI Compare',
          color: 'purple'
        });
      } catch (groupError) {
        // Tab grouping might not be available in all contexts, continue anyway
        console.warn('Tab grouping failed:', groupError);
      }
    }
    
    // Activate the first tab
    if (tabIds.length > 0) {
      await chrome.tabs.update(tabIds[0], { active: true });
    }
    
  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
  }
  
  return results;
}

/**
 * Queue model selection for a tab
 * This waits for the tab to load, then sends a message to the content script
 */
function queueModelSelection(tabId, service, modelId, results) {
  const selectionId = `${tabId}-${service}`;
  
  pendingModelSelections.set(selectionId, {
    tabId,
    service,
    modelId,
    status: 'pending'
  });

  // Listen for tab to finish loading
  const listener = async (updatedTabId, changeInfo, tab) => {
    if (updatedTabId !== tabId) return;
    
    if (changeInfo.status === 'complete') {
      // Remove listener
      chrome.tabs.onUpdated.removeListener(listener);
      
      // Wait a bit for SPA to initialize
      await sleep(1500);
      
      // Send message to content script
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          action: 'selectModel',
          service: service,
          modelId: modelId
        });
        
        results.modelSelections.push({
          service,
          modelId,
          success: response?.success || false,
          error: response?.error || null
        });

        pendingModelSelections.set(selectionId, {
          ...pendingModelSelections.get(selectionId),
          status: response?.success ? 'success' : 'failed',
          error: response?.error
        });

        // Notify any open popups about the result
        notifyModelSelectionResult(service, modelId, response);
        
      } catch (error) {
        console.error(`[DualAI] Failed to send model selection message to ${service}:`, error);
        
        results.modelSelections.push({
          service,
          modelId,
          success: false,
          error: error.message
        });

        pendingModelSelections.set(selectionId, {
          ...pendingModelSelections.get(selectionId),
          status: 'failed',
          error: error.message
        });

        notifyModelSelectionResult(service, modelId, { success: false, error: error.message });
      }

      // Clean up after a delay
      setTimeout(() => {
        pendingModelSelections.delete(selectionId);
      }, 30000);
    }
  };

  chrome.tabs.onUpdated.addListener(listener);

  // Timeout fallback - if tab never completes loading
  setTimeout(() => {
    chrome.tabs.onUpdated.removeListener(listener);
    if (pendingModelSelections.get(selectionId)?.status === 'pending') {
      pendingModelSelections.set(selectionId, {
        ...pendingModelSelections.get(selectionId),
        status: 'timeout',
        error: 'Tab load timeout'
      });
      notifyModelSelectionResult(service, modelId, { 
        success: false, 
        error: 'Tab load timeout' 
      });
    }
  }, 30000);
}

/**
 * Notify popup about model selection result
 */
function notifyModelSelectionResult(service, modelId, result) {
  chrome.runtime.sendMessage({
    action: 'modelSelectionResult',
    service,
    modelId,
    success: result.success,
    error: result.error
  }).catch(() => {
    // Popup might be closed, that's fine
  });
}

/**
 * Handle copying text to clipboard
 */
async function handleCopyToClipboard(text) {
  try {
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Dual AI Chat Launcher installed');
  } else if (details.reason === 'update') {
    console.log('Dual AI Chat Launcher updated to version', chrome.runtime.getManifest().version);
  }
});
