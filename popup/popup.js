/**
 * Popup UI Logic
 * Handles user interactions and coordinates with background service worker
 */

import {
  getStorage,
  getSettings,
  updateSettings,
  getPreferences,
  updatePreferences,
  getClaudeProjects,
  addClaudeProject,
  deleteClaudeProject,
  setDefaultClaudeProject,
  getGeminiGems,
  addGeminiGem,
  deleteGeminiGem,
  setDefaultGeminiGem,
  getDefaultGeminiAccountIndex
} from '../lib/storage.js';

import {
  parseClaudeUrl,
  parseGeminiUrl,
  isValidClaudeProjectUrl,
  isValidGeminiGemUrl,
  CLAUDE_MODELS,
  GEMINI_MODELS
} from '../lib/url-builder.js';

// ============ DOM Elements ============
const elements = {
  // Prompt
  promptInput: document.getElementById('promptInput'),
  fileReference: document.getElementById('fileReference'),
  
  // Service toggles
  claudeEnabled: document.getElementById('claudeEnabled'),
  geminiEnabled: document.getElementById('geminiEnabled'),
  claudeCard: document.getElementById('claudeCard'),
  geminiCard: document.getElementById('geminiCard'),
  
  // Dropdowns
  claudeProject: document.getElementById('claudeProject'),
  claudeModel: document.getElementById('claudeModel'),
  geminiGem: document.getElementById('geminiGem'),
  geminiModel: document.getElementById('geminiModel'),
  
  // Add buttons
  addClaudeProject: document.getElementById('addClaudeProject'),
  addGeminiGem: document.getElementById('addGeminiGem'),
  
  // Launch
  launchBtn: document.getElementById('launchBtn'),
  status: document.getElementById('status'),
  
  // Settings
  settingsBtn: document.getElementById('settingsBtn'),
  settingsPanel: document.getElementById('settingsPanel'),
  closeSettings: document.getElementById('closeSettings'),
  claudeProjectsList: document.getElementById('claudeProjectsList'),
  geminiGemsList: document.getElementById('geminiGemsList'),
  addClaudeProjectSettings: document.getElementById('addClaudeProjectSettings'),
  addGeminiGemSettings: document.getElementById('addGeminiGemSettings'),
  
  // Preferences
  prefAutoClose: document.getElementById('prefAutoClose'),
  prefGroupTabs: document.getElementById('prefGroupTabs'),
  prefRememberPrompt: document.getElementById('prefRememberPrompt'),
  
  // Modal
  modalOverlay: document.getElementById('modalOverlay'),
  modalTitle: document.getElementById('modalTitle'),
  configName: document.getElementById('configName'),
  configUrl: document.getElementById('configUrl'),
  urlHint: document.getElementById('urlHint'),
  saveModal: document.getElementById('saveModal'),
  cancelModal: document.getElementById('cancelModal'),
  closeModal: document.getElementById('closeModal'),
  
  // Inspector
  inspectPageBtn: document.getElementById('inspectPageBtn'),
  inspectWithMenuBtn: document.getElementById('inspectWithMenuBtn'),
  inspectorModalOverlay: document.getElementById('inspectorModalOverlay'),
  closeInspectorModal: document.getElementById('closeInspectorModal'),
  inspectorSummary: document.getElementById('inspectorSummary'),
  inspectorOutput: document.getElementById('inspectorOutput'),
  copyInspectorJson: document.getElementById('copyInspectorJson'),
  copyWithPrompt: document.getElementById('copyWithPrompt'),

  // Onboarding
  onboardingTooltip: document.getElementById('onboardingTooltip'),
  dismissTooltip: document.getElementById('dismissTooltip')
};

// Current modal state
let modalState = {
  type: null, // 'claude' or 'gemini'
  mode: 'add' // 'add' or 'edit'
};

// ============ Initialization ============
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  await loadProjects();
  await loadGems();
  await loadPreferences();
  await checkOnboarding();
  setupEventListeners();
  updateLaunchButtonState();
}

async function loadSettings() {
  const settings = await getSettings();
  
  elements.claudeEnabled.checked = settings.claudeEnabled;
  elements.geminiEnabled.checked = settings.geminiEnabled;
  elements.claudeModel.value = settings.claudeModel;
  elements.geminiModel.value = settings.geminiModel;
  
  updateCardState('claude', settings.claudeEnabled);
  updateCardState('gemini', settings.geminiEnabled);
  
  // Restore last prompt if preference is set
  const prefs = await getPreferences();
  if (prefs.rememberLastPrompt && settings.lastPrompt) {
    elements.promptInput.value = settings.lastPrompt;
  }
}

async function loadProjects() {
  const projects = await getClaudeProjects();
  const settings = await getSettings();
  
  // Clear and rebuild dropdown
  elements.claudeProject.innerHTML = '<option value="">No project (new chat)</option>';
  
  projects.forEach(project => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    if (project.isDefault) {
      option.textContent += ' ★';
    }
    elements.claudeProject.appendChild(option);
  });
  
  // Restore selection
  if (settings.selectedClaudeProjectId) {
    elements.claudeProject.value = settings.selectedClaudeProjectId;
  }
  
  // Update settings list
  renderProjectsList(projects);
}

async function loadGems() {
  const gems = await getGeminiGems();
  const settings = await getSettings();
  
  // Clear and rebuild dropdown
  elements.geminiGem.innerHTML = '<option value="">No gem (new chat)</option>';
  
  gems.forEach(gem => {
    const option = document.createElement('option');
    option.value = gem.id;
    option.textContent = gem.name;
    if (gem.isDefault) {
      option.textContent += ' ★';
    }
    elements.geminiGem.appendChild(option);
  });
  
  // Restore selection
  if (settings.selectedGeminiGemId) {
    elements.geminiGem.value = settings.selectedGeminiGemId;
  }
  
  // Update settings list
  renderGemsList(gems);
}

async function loadPreferences() {
  const prefs = await getPreferences();
  elements.prefAutoClose.checked = prefs.autoClosePopup;
  elements.prefGroupTabs.checked = prefs.groupTabs;
  elements.prefRememberPrompt.checked = prefs.rememberLastPrompt;
}

async function checkOnboarding() {
  const prefs = await getPreferences();
  const projects = await getClaudeProjects();
  const gems = await getGeminiGems();
  
  // Show onboarding if no configs and not dismissed
  if (!prefs.onboardingComplete && projects.length === 0 && gems.length === 0) {
    elements.onboardingTooltip.hidden = false;
  }
}

// ============ Event Listeners ============
function setupEventListeners() {
  // Service toggles
  elements.claudeEnabled.addEventListener('change', handleClaudeToggle);
  elements.geminiEnabled.addEventListener('change', handleGeminiToggle);
  
  // Dropdown changes
  elements.claudeProject.addEventListener('change', handleClaudeProjectChange);
  elements.claudeModel.addEventListener('change', handleClaudeModelChange);
  elements.geminiGem.addEventListener('change', handleGeminiGemChange);
  elements.geminiModel.addEventListener('change', handleGeminiModelChange);
  
  // Add buttons
  elements.addClaudeProject.addEventListener('click', () => openModal('claude'));
  elements.addGeminiGem.addEventListener('click', () => openModal('gemini'));
  elements.addClaudeProjectSettings.addEventListener('click', () => openModal('claude'));
  elements.addGeminiGemSettings.addEventListener('click', () => openModal('gemini'));
  
  // Launch button
  elements.launchBtn.addEventListener('click', handleLaunch);
  
  // Keyboard shortcut
  elements.promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleLaunch();
    }
  });
  
  // Settings panel
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettings.addEventListener('click', closeSettings);
  
  // Preferences
  elements.prefAutoClose.addEventListener('change', handlePrefChange);
  elements.prefGroupTabs.addEventListener('change', handlePrefChange);
  elements.prefRememberPrompt.addEventListener('change', handlePrefChange);
  
  // Modal
  elements.saveModal.addEventListener('click', handleModalSave);
  elements.cancelModal.addEventListener('click', closeModal);
  elements.closeModal.addEventListener('click', closeModal);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });
  
  // URL input validation
  elements.configUrl.addEventListener('input', handleUrlInput);
  
  // Inspector
  elements.inspectPageBtn.addEventListener('click', () => runInspector(false));
  elements.inspectWithMenuBtn.addEventListener('click', () => runInspector(true));
  elements.closeInspectorModal.addEventListener('click', closeInspectorModal);
  elements.inspectorModalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.inspectorModalOverlay) closeInspectorModal();
  });
  elements.copyInspectorJson.addEventListener('click', copyInspectorJson);
  elements.copyWithPrompt.addEventListener('click', copyInspectorWithPrompt);

  // Onboarding
  elements.dismissTooltip.addEventListener('click', dismissOnboarding);
}

// ============ Toggle Handlers ============
async function handleClaudeToggle(e) {
  const enabled = e.target.checked;
  await updateSettings({ claudeEnabled: enabled });
  updateCardState('claude', enabled);
  updateLaunchButtonState();
}

async function handleGeminiToggle(e) {
  const enabled = e.target.checked;
  await updateSettings({ geminiEnabled: enabled });
  updateCardState('gemini', enabled);
  updateLaunchButtonState();
}

function updateCardState(service, enabled) {
  const card = service === 'claude' ? elements.claudeCard : elements.geminiCard;
  card.classList.toggle('disabled', !enabled);
}

function updateLaunchButtonState() {
  const claudeEnabled = elements.claudeEnabled.checked;
  const geminiEnabled = elements.geminiEnabled.checked;
  const hasPrompt = elements.promptInput.value.trim().length > 0;
  
  elements.launchBtn.disabled = !hasPrompt || (!claudeEnabled && !geminiEnabled);
}

// Watch prompt input for button state
elements.promptInput.addEventListener('input', updateLaunchButtonState);

// ============ Dropdown Handlers ============
async function handleClaudeProjectChange(e) {
  await updateSettings({ selectedClaudeProjectId: e.target.value || null });
}

async function handleClaudeModelChange(e) {
  await updateSettings({ claudeModel: e.target.value });
}

async function handleGeminiGemChange(e) {
  await updateSettings({ selectedGeminiGemId: e.target.value || null });
}

async function handleGeminiModelChange(e) {
  await updateSettings({ geminiModel: e.target.value });
}

// ============ Settings Panel ============
function openSettings() {
  elements.settingsPanel.hidden = false;
  // Trigger reflow for animation
  elements.settingsPanel.offsetHeight;
}

function closeSettings() {
  elements.settingsPanel.hidden = true;
}

// ============ Preferences ============
async function handlePrefChange() {
  await updatePreferences({
    autoClosePopup: elements.prefAutoClose.checked,
    groupTabs: elements.prefGroupTabs.checked,
    rememberLastPrompt: elements.prefRememberPrompt.checked
  });
}

// ============ Modal ============
function openModal(type) {
  modalState.type = type;
  modalState.mode = 'add';
  
  const isClaud = type === 'claude';
  elements.modalTitle.textContent = isClaud ? 'Add Claude Project' : 'Add Gemini Gem';
  elements.configName.value = '';
  elements.configUrl.value = '';
  elements.configUrl.placeholder = isClaud 
    ? 'https://claude.ai/project/...'
    : 'https://gemini.google.com/u/.../gem/...';
  elements.urlHint.textContent = 'Open your project/gem and copy the URL from the address bar';
  elements.urlHint.classList.remove('error');
  
  elements.modalOverlay.hidden = false;
  elements.configName.focus();
}

function closeModal() {
  elements.modalOverlay.hidden = true;
  modalState.type = null;
}

function handleUrlInput() {
  const url = elements.configUrl.value.trim();
  const isClaud = modalState.type === 'claude';
  
  if (!url) {
    elements.urlHint.textContent = 'Open your project/gem and copy the URL from the address bar';
    elements.urlHint.classList.remove('error');
    return;
  }
  
  if (isClaud) {
    if (isValidClaudeProjectUrl(url)) {
      elements.urlHint.textContent = '✓ Valid Claude project URL';
      elements.urlHint.classList.remove('error');
    } else {
      elements.urlHint.textContent = 'URL should look like: https://claude.ai/project/...';
      elements.urlHint.classList.add('error');
    }
  } else {
    if (isValidGeminiGemUrl(url)) {
      const parsed = parseGeminiUrl(url);
      elements.urlHint.textContent = `✓ Valid Gemini gem URL (account #${parsed.accountIndex})`;
      elements.urlHint.classList.remove('error');
    } else {
      elements.urlHint.textContent = 'URL should look like: https://gemini.google.com/u/X/gem/...';
      elements.urlHint.classList.add('error');
    }
  }
}

async function handleModalSave() {
  const name = elements.configName.value.trim();
  const url = elements.configUrl.value.trim();
  
  if (!name) {
    elements.configName.focus();
    return;
  }
  
  if (!url) {
    elements.configUrl.focus();
    return;
  }
  
  const isClaud = modalState.type === 'claude';
  
  if (isClaud) {
    const parsed = parseClaudeUrl(url);
    if (!parsed) {
      elements.urlHint.textContent = 'Invalid URL. Please paste the full URL from your browser.';
      elements.urlHint.classList.add('error');
      return;
    }
    
    await addClaudeProject({
      name,
      projectId: parsed.projectId
    });
    
    await loadProjects();
  } else {
    const parsed = parseGeminiUrl(url);
    if (!parsed) {
      elements.urlHint.textContent = 'Invalid URL. Please paste the full URL from your browser.';
      elements.urlHint.classList.add('error');
      return;
    }
    
    await addGeminiGem({
      name,
      gemId: parsed.gemId,
      accountIndex: parsed.accountIndex
    });
    
    await loadGems();
  }
  
  closeModal();
  showStatus('Configuration saved!', 'success');
}

// ============ Config Lists (Settings Panel) ============
function renderProjectsList(projects) {
  if (projects.length === 0) {
    elements.claudeProjectsList.innerHTML = '<div class="empty-state">No projects added yet</div>';
    return;
  }
  
  elements.claudeProjectsList.innerHTML = projects.map(project => `
    <div class="config-item" data-id="${project.id}">
      <span class="config-name">${escapeHtml(project.name)}</span>
      ${project.isDefault ? '<span class="config-default">Default</span>' : ''}
      <button class="btn-delete" data-action="delete-claude" data-id="${project.id}" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Add delete handlers
  elements.claudeProjectsList.querySelectorAll('[data-action="delete-claude"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      await deleteClaudeProject(id);
      await loadProjects();
      showStatus('Project deleted', 'success');
    });
  });
}

function renderGemsList(gems) {
  if (gems.length === 0) {
    elements.geminiGemsList.innerHTML = '<div class="empty-state">No gems added yet</div>';
    return;
  }
  
  elements.geminiGemsList.innerHTML = gems.map(gem => `
    <div class="config-item" data-id="${gem.id}">
      <span class="config-name">${escapeHtml(gem.name)}</span>
      ${gem.isDefault ? '<span class="config-default">Default</span>' : ''}
      <button class="btn-delete" data-action="delete-gemini" data-id="${gem.id}" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Add delete handlers
  elements.geminiGemsList.querySelectorAll('[data-action="delete-gemini"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      await deleteGeminiGem(id);
      await loadGems();
      showStatus('Gem deleted', 'success');
    });
  });
}

// ============ Launch ============
async function handleLaunch() {
  const prompt = elements.promptInput.value.trim();
  
  if (!prompt) {
    showStatus('Please enter a prompt', 'error');
    return;
  }
  
  const claudeEnabled = elements.claudeEnabled.checked;
  const geminiEnabled = elements.geminiEnabled.checked;
  
  if (!claudeEnabled && !geminiEnabled) {
    showStatus('Enable at least one service', 'error');
    return;
  }
  
  // Get selected configurations
  const claudeProjectId = elements.claudeProject.value || null;
  const geminiGemId = elements.geminiGem.value || null;
  
  // Get model selections
  const claudeModel = elements.claudeModel.value;
  const geminiModel = elements.geminiModel.value;
  
  // Get account index for Gemini
  let geminiAccountIndex = null;
  if (geminiEnabled) {
    if (geminiGemId) {
      const gems = await getGeminiGems();
      const selectedGem = gems.find(g => g.id === geminiGemId);
      if (selectedGem) {
        geminiAccountIndex = selectedGem.accountIndex;
      }
    } else {
      geminiAccountIndex = await getDefaultGeminiAccountIndex();
    }
  }
  
  // Update button state
  elements.launchBtn.classList.add('loading');
  elements.launchBtn.disabled = true;
  
  // Track model selection status for display
  const modelStatus = {
    claude: claudeEnabled ? 'pending' : null,
    gemini: geminiEnabled ? 'pending' : null
  };
  
  try {
    // Copy to clipboard
    await navigator.clipboard.writeText(prompt);
    
    // Get project/gem IDs (not internal IDs)
    let claudeProjectIdForUrl = null;
    if (claudeProjectId) {
      const projects = await getClaudeProjects();
      const project = projects.find(p => p.id === claudeProjectId);
      if (project) {
        claudeProjectIdForUrl = project.projectId;
      }
    }
    
    let geminiGemIdForUrl = null;
    if (geminiGemId) {
      const gems = await getGeminiGems();
      const gem = gems.find(g => g.id === geminiGemId);
      if (gem) {
        geminiGemIdForUrl = gem.gemId;
      }
    }
    
    // Send message to background to open tabs
    const result = await chrome.runtime.sendMessage({
      action: 'launchChats',
      data: {
        prompt,
        claudeEnabled,
        geminiEnabled,
        claudeProjectId: claudeProjectIdForUrl,
        geminiGemId: geminiGemIdForUrl,
        geminiAccountIndex,
        claudeModel,
        geminiModel
      }
    });
    
    if (result.success) {
      elements.launchBtn.classList.remove('loading');
      elements.launchBtn.classList.add('success');
      
      const tabCount = result.tabsOpened.length;
      showStatus(`Copied! Opened ${tabCount} tab${tabCount > 1 ? 's' : ''} — paste with Ctrl+V`, 'success');
      
      // Show model selection pending status
      showModelSelectionStatus(modelStatus);
      
      // Save prompt if preference is set
      const prefs = await getPreferences();
      if (prefs.rememberLastPrompt) {
        await updateSettings({ lastPrompt: prompt });
      }
      
      // Auto-close if preference is set (with delay for model selection feedback)
      if (prefs.autoClosePopup) {
        setTimeout(() => window.close(), 3000);
      }
      
      // Reset button after delay
      setTimeout(() => {
        elements.launchBtn.classList.remove('success');
        elements.launchBtn.disabled = false;
      }, 2000);
    } else {
      throw new Error(result.errors?.join(', ') || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Launch failed:', error);
    elements.launchBtn.classList.remove('loading');
    elements.launchBtn.disabled = false;
    showStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Show model selection status with updates
 */
function showModelSelectionStatus(modelStatus) {
  const services = [];
  if (modelStatus.claude) services.push('Claude');
  if (modelStatus.gemini) services.push('Gemini');
  
  if (services.length === 0) return;
  
  // Update status to show model selection is happening
  setTimeout(() => {
    const currentStatus = elements.status.textContent;
    if (currentStatus.includes('Copied')) {
      elements.status.innerHTML = `${currentStatus}<br><span class="model-status">⏳ Setting models...</span>`;
    }
  }, 1000);
}

/**
 * Handle model selection result from background
 */
function handleModelSelectionResult(message) {
  const { service, success, error } = message;
  
  // Find or create the model status element
  let modelStatusEl = elements.status.querySelector('.model-status');
  if (!modelStatusEl) {
    modelStatusEl = document.createElement('span');
    modelStatusEl.className = 'model-status';
    elements.status.appendChild(document.createElement('br'));
    elements.status.appendChild(modelStatusEl);
  }
  
  // Update the status
  const currentText = modelStatusEl.textContent || '';
  const serviceDisplay = service.charAt(0).toUpperCase() + service.slice(1);
  
  if (success) {
    modelStatusEl.innerHTML = currentText.replace('⏳ Setting models...', '') + 
      `<span class="model-success">✓ ${serviceDisplay} model set</span> `;
  } else {
    modelStatusEl.innerHTML = currentText.replace('⏳ Setting models...', '') + 
      `<span class="model-warning">⚠ ${serviceDisplay}: select model manually</span> `;
    console.warn(`[DualAI] Model selection failed for ${service}:`, error);
  }
}

// Listen for model selection results from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'modelSelectionResult') {
    handleModelSelectionResult(message);
  }
});

// ============ DOM Inspector ============
let lastInspectorResult = null;

async function runInspector(withDelay) {
  showStatus('Inspecting page...', '');
  
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('No active tab found', 'error');
      return;
    }
    
    // Check if it's an AI chat tab
    if (!tab.url.includes('claude.ai') && !tab.url.includes('gemini.google.com')) {
      showStatus('Please open a Claude or Gemini tab first', 'error');
      return;
    }
    
    if (withDelay) {
      showStatus('Open the model dropdown now! Inspecting in 3s...', '');
      await sleep(3000);
    }
    
    // Send message to content script
    const result = await chrome.tabs.sendMessage(tab.id, { action: 'inspectDOM' });
    
    if (result) {
      lastInspectorResult = result;
      displayInspectorResults(result);
      elements.inspectorModalOverlay.hidden = false;
      showStatus('Inspection complete', 'success');
    } else {
      showStatus('No response from page', 'error');
    }
    
  } catch (error) {
    console.error('Inspector error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  }
}

function displayInspectorResults(result) {
  // Build summary HTML
  const summary = result.summary;
  const controls = result.likelyControls;
  
  let summaryHtml = `
    <h4>📊 Summary (${result.meta.service})</h4>
    <div class="summary-grid">
      <div class="summary-item"><span>Buttons:</span><span>${summary.buttons}</span></div>
      <div class="summary-item"><span>Inputs:</span><span>${summary.inputs}</span></div>
      <div class="summary-item"><span>Dropdowns:</span><span>${summary.dropdowns}</span></div>
      <div class="summary-item"><span>Menus:</span><span>${summary.menus}</span></div>
    </div>
    <div class="likely-control ${controls.modelSelector ? 'found' : 'not-found'}">
      Model Selector: ${controls.modelSelector ? '✓ Found' : '✗ Not found'}
    </div>
    <div class="likely-control ${controls.chatInput ? 'found' : 'not-found'}">
      Chat Input: ${controls.chatInput ? '✓ Found' : '✗ Not found'}
    </div>
    <div class="likely-control ${controls.submitButton ? 'found' : 'not-found'}">
      Submit Button: ${controls.submitButton ? '✓ Found' : '✗ Not found'}
    </div>
  `;
  
  elements.inspectorSummary.innerHTML = summaryHtml;
  
  // Format JSON output (exclude rawStructure for readability)
  const outputData = { ...result };
  delete outputData.rawStructure; // Too verbose for display
  elements.inspectorOutput.value = JSON.stringify(outputData, null, 2);
}

function closeInspectorModal() {
  elements.inspectorModalOverlay.hidden = true;
}

async function copyInspectorJson() {
  if (!lastInspectorResult) return;
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastInspectorResult, null, 2));
    showStatus('JSON copied to clipboard', 'success');
  } catch (error) {
    showStatus('Failed to copy', 'error');
  }
}

async function copyInspectorWithPrompt() {
  if (!lastInspectorResult) return;
  
  const prompt = generateAIPrompt(lastInspectorResult);
  
  try {
    await navigator.clipboard.writeText(prompt);
    showStatus('Copied with AI prompt', 'success');
  } catch (error) {
    showStatus('Failed to copy', 'error');
  }
}

function generateAIPrompt(result) {
  const service = result.meta.service;
  
  return `# DOM Inspection Results for ${service.charAt(0).toUpperCase() + service.slice(1)}

## Context
I'm building a Chrome extension that needs to interact with the ${service} web interface.
I need to identify the correct selectors for:
1. **Model selector dropdown** - The button/element that opens the model selection menu
2. **Model options** - The menu items in the dropdown (e.g., Opus 4.5, Sonnet 4.5, etc. for Claude)
3. **Chat input** - The textarea/input where users type their prompts
4. **Submit button** - The button to send the message

## Inspection Data
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`

## Questions
1. Based on this DOM structure, what is the most reliable CSS selector to find the model selector button?
2. Once the dropdown is open, what selector should I use to find and click a specific model option (e.g., "Haiku 4.5")?
3. What selector would reliably find the chat input?
4. What selector would find the submit button?

Please provide specific CSS selectors and explain why they are reliable (e.g., uses data-testid, stable class names, etc.).
Also note any elements that might be dynamic or change frequently.`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ Onboarding ============
async function dismissOnboarding() {
  elements.onboardingTooltip.hidden = true;
  await updatePreferences({ onboardingComplete: true });
}

// ============ Utilities ============
function showStatus(message, type = '') {
  elements.status.textContent = message;
  elements.status.className = 'status ' + type;
  
  // Clear after delay
  setTimeout(() => {
    elements.status.textContent = '';
    elements.status.className = 'status';
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
