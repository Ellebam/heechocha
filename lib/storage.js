/**
 * Storage utility for Chrome extension
 * Wraps chrome.storage.sync with defaults and type safety
 */

const DEFAULT_STORAGE = {
  claudeProjects: [],
  geminiGems: [],
  currentSettings: {
    claudeEnabled: true,
    geminiEnabled: true,
    chatgptEnabled: true,
    selectedClaudeProjectId: null,
    selectedGeminiGemId: null,
    defaultGeminiAccountIndex: null,
    claudeModel: 'sonnet-4.5',
    geminiModel: 'thinking',
    chatgptModel: 'gpt-4o'
  },
  preferences: {
    autoClosePopup: false,
    groupTabs: true,
    rememberLastPrompt: false,
    onboardingComplete: false
  }
};

/**
 * Get all storage data with defaults applied
 */
export async function getStorage() {
  const data = await chrome.storage.sync.get(DEFAULT_STORAGE);
  return { ...DEFAULT_STORAGE, ...data };
}

/**
 * Update storage with partial data
 */
export async function updateStorage(updates) {
  await chrome.storage.sync.set(updates);
}

/**
 * Get current settings
 */
export async function getSettings() {
  const { currentSettings } = await getStorage();
  return currentSettings;
}

/**
 * Update current settings
 */
export async function updateSettings(updates) {
  const { currentSettings } = await getStorage();
  await updateStorage({
    currentSettings: { ...currentSettings, ...updates }
  });
}

/**
 * Get user preferences
 */
export async function getPreferences() {
  const { preferences } = await getStorage();
  return preferences;
}

/**
 * Update user preferences
 */
export async function updatePreferences(updates) {
  const { preferences } = await getStorage();
  await updateStorage({
    preferences: { ...preferences, ...updates }
  });
}

// ============ Claude Projects ============

/**
 * Get all Claude projects
 */
export async function getClaudeProjects() {
  const { claudeProjects } = await getStorage();
  return claudeProjects;
}

/**
 * Add a Claude project
 */
export async function addClaudeProject(project) {
  const projects = await getClaudeProjects();
  const newProject = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    isDefault: projects.length === 0,
    ...project
  };
  await updateStorage({ claudeProjects: [...projects, newProject] });
  return newProject;
}

/**
 * Update a Claude project
 */
export async function updateClaudeProject(id, updates) {
  const projects = await getClaudeProjects();
  const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
  await updateStorage({ claudeProjects: updated });
}

/**
 * Delete a Claude project
 */
export async function deleteClaudeProject(id) {
  const projects = await getClaudeProjects();
  const filtered = projects.filter(p => p.id !== id);

  // If we deleted the default, make first remaining one default
  if (filtered.length > 0 && !filtered.some(p => p.isDefault)) {
    filtered[0].isDefault = true;
  }

  await updateStorage({ claudeProjects: filtered });

  // Clear selection if deleted project was selected
  const { currentSettings } = await getStorage();
  if (currentSettings.selectedClaudeProjectId === id) {
    await updateSettings({ selectedClaudeProjectId: null });
  }
}

/**
 * Set a Claude project as default
 */
export async function setDefaultClaudeProject(id) {
  const projects = await getClaudeProjects();
  const updated = projects.map(p => ({ ...p, isDefault: p.id === id }));
  await updateStorage({ claudeProjects: updated });
}

// ============ Gemini Gems ============

/**
 * Get all Gemini gems
 */
export async function getGeminiGems() {
  const { geminiGems } = await getStorage();
  return geminiGems;
}

/**
 * Add a Gemini gem
 */
export async function addGeminiGem(gem) {
  const gems = await getGeminiGems();
  const newGem = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    isDefault: gems.length === 0,
    ...gem
  };

  await updateStorage({ geminiGems: [...gems, newGem] });

  // Set default account index from first gem (Option A)
  const { currentSettings } = await getStorage();
  if (currentSettings.defaultGeminiAccountIndex === null) {
    await updateSettings({ defaultGeminiAccountIndex: gem.accountIndex });
  }

  return newGem;
}

/**
 * Update a Gemini gem
 */
export async function updateGeminiGem(id, updates) {
  const gems = await getGeminiGems();
  const updated = gems.map(g => g.id === id ? { ...g, ...updates } : g);
  await updateStorage({ geminiGems: updated });
}

/**
 * Delete a Gemini gem
 */
export async function deleteGeminiGem(id) {
  const gems = await getGeminiGems();
  const filtered = gems.filter(g => g.id !== id);

  // If we deleted the default, make first remaining one default
  if (filtered.length > 0 && !filtered.some(g => g.isDefault)) {
    filtered[0].isDefault = true;
  }

  await updateStorage({ geminiGems: filtered });

  // Clear selection if deleted gem was selected
  const { currentSettings } = await getStorage();
  if (currentSettings.selectedGeminiGemId === id) {
    await updateSettings({ selectedGeminiGemId: null });
  }
}

/**
 * Set a Gemini gem as default
 */
export async function setDefaultGeminiGem(id) {
  const gems = await getGeminiGems();
  const updated = gems.map(g => ({ ...g, isDefault: g.id === id }));
  await updateStorage({ geminiGems: updated });
}

/**
 * Get the default Gemini account index
 */
export async function getDefaultGeminiAccountIndex() {
  const { currentSettings, geminiGems } = await getStorage();

  // Return stored default if available
  if (currentSettings.defaultGeminiAccountIndex !== null) {
    return currentSettings.defaultGeminiAccountIndex;
  }

  // Otherwise try to get from first gem
  if (geminiGems.length > 0) {
    return geminiGems[0].accountIndex;
  }

  return null;
}
