/**
 * Background Service Worker
 * Handles tab creation, grouping, and coordination with content scripts
 */

// URL builders (inline to avoid module issues in service worker)
function buildClaudeUrl(projectId) {
  if (projectId) {
    return `https://claude.ai/project/${projectId}`;
  }
  return 'https://claude.ai/new';
}

function buildGeminiUrl(gemId, accountIndex) {
  const accountPath = accountIndex !== null ? `/u/${accountIndex}` : '';
  if (gemId) {
    return `https://gemini.google.com${accountPath}/gem/${gemId}`;
  }
  return `https://gemini.google.com${accountPath}/app`;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'launchChats') {
    handleLaunchChats(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, errors: [error.message] }));
    return true; // Keep channel open for async
  }
});

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

  const tabsOpened = [];
  const errors = [];

  // Get current window for tab grouping
  const currentWindow = await chrome.windows.getCurrent();

  try {
    // Open Claude tab
    if (claudeEnabled) {
      const claudeUrl = buildClaudeUrl(claudeProjectId);
      const claudeTab = await chrome.tabs.create({
        url: claudeUrl,
        active: true,
        windowId: currentWindow.id
      });
      tabsOpened.push({ service: 'claude', tabId: claudeTab.id, model: claudeModel });
    }

    // Open Gemini tab
    if (geminiEnabled) {
      const geminiUrl = buildGeminiUrl(geminiGemId, geminiAccountIndex);
      const geminiTab = await chrome.tabs.create({
        url: geminiUrl,
        active: !claudeEnabled, // Active only if Claude wasn't opened
        windowId: currentWindow.id
      });
      tabsOpened.push({ service: 'gemini', tabId: geminiTab.id, model: geminiModel });
    }

    // Group tabs if multiple opened
    if (tabsOpened.length > 1) {
      try {
        const tabIds = tabsOpened.map(t => t.tabId);
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, {
          title: 'AI Compare',
          color: 'purple'
        });
      } catch (groupError) {
        console.warn('Tab grouping failed:', groupError);
        // Non-fatal, continue
      }
    }

    // Schedule model selection for each tab (after page loads)
    for (const tab of tabsOpened) {
      scheduleModelSelection(tab.tabId, tab.service, tab.model, prompt);
    }

    return {
      success: true,
      tabsOpened: tabsOpened
    };

  } catch (error) {
    console.error('Launch failed:', error);
    return {
      success: false,
      errors: [error.message],
      tabsOpened: tabsOpened
    };
  }
}

/**
 * Schedule model selection after tab finishes loading
 */
function scheduleModelSelection(tabId, service, modelId, prompt) {
  // Wait for tab to complete loading
  const checkTab = async (attempts = 0) => {
    if (attempts > 30) { // 15 seconds max
      notifyPopup(service, false, 'Page load timeout');
      return;
    }

    try {
      const tab = await chrome.tabs.get(tabId);
      
      if (tab.status === 'complete') {
        // Small delay to let JS frameworks initialize
        setTimeout(async () => {
          await performModelSelection(tabId, service, modelId, prompt);
        }, 1500);
      } else {
        // Check again in 500ms
        setTimeout(() => checkTab(attempts + 1), 500);
      }
    } catch (error) {
      console.error(`Tab ${tabId} no longer exists:`, error);
    }
  };

  checkTab();
}

/**
 * Send model selection message to content script
 */
async function performModelSelection(tabId, service, modelId, prompt) {
  try {
    // Send model selection message
    const modelResult = await chrome.tabs.sendMessage(tabId, {
      action: 'selectModel',
      service: service,
      modelId: modelId
    });

    if (modelResult?.success) {
      notifyPopup(service, true, 'Model selected');
    } else {
      notifyPopup(service, false, modelResult?.error || 'Selection failed');
    }

    // After model selection, try to insert prompt
    setTimeout(async () => {
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: 'insertPrompt',
          service: service,
          prompt: prompt
        });
      } catch (e) {
        console.warn(`Prompt insertion failed for ${service}:`, e);
      }
    }, 500);

  } catch (error) {
    console.error(`Model selection failed for ${service}:`, error);
    notifyPopup(service, false, error.message);
  }
}

/**
 * Notify popup of model selection result
 */
function notifyPopup(service, success, message) {
  chrome.runtime.sendMessage({
    action: 'modelSelectionResult',
    service: service,
    success: success,
    error: success ? null : message
  }).catch(() => {
    // Popup might be closed, that's fine
  });
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Dual AI Chat Launcher installed');
  } else if (details.reason === 'update') {
    console.log('Dual AI Chat Launcher updated to version', chrome.runtime.getManifest().version);
  }
});