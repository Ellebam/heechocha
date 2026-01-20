/**
 * URL Builder utilities for Claude and Gemini
 */

// ============ URL Construction ============

/**
 * Build Claude URL
 * @param {string|null} projectId - Claude project UUID or null for new chat
 * @returns {string} Full Claude URL
 */
export function buildClaudeUrl(projectId) {
  if (projectId) {
    return `https://claude.ai/project/${projectId}`;
  }
  return 'https://claude.ai/new';
}

/**
 * Build Gemini URL
 * @param {string|null} gemId - Gemini gem ID or null for new chat
 * @param {number|null} accountIndex - Google account index
 * @returns {string} Full Gemini URL
 */
export function buildGeminiUrl(gemId, accountIndex) {
  const accountPath = accountIndex !== null ? `/u/${accountIndex}` : '';
  
  if (gemId) {
    return `https://gemini.google.com${accountPath}/gem/${gemId}`;
  }
  return `https://gemini.google.com${accountPath}/app`;
}

// ============ URL Parsing ============

/**
 * Parse a Claude project URL to extract project ID
 * @param {string} url - Full Claude URL
 * @returns {{ projectId: string } | null}
 */
export function parseClaudeUrl(url) {
  // Matches: https://claude.ai/project/019bd256-e54e-741b-a8a5-0e1f0cbea856
  const match = url.match(/claude\.ai\/project\/([a-f0-9-]{36})/i);
  if (match) {
    return { projectId: match[1] };
  }
  return null;
}

/**
 * Parse a Gemini gem URL to extract gem ID and account index
 * @param {string} url - Full Gemini URL
 * @returns {{ gemId: string, accountIndex: number } | null}
 */
export function parseGeminiUrl(url) {
  // Matches: https://gemini.google.com/u/6/gem/27f573a8f861
  const match = url.match(/gemini\.google\.com\/u\/(\d+)\/gem\/([a-zA-Z0-9]+)/);
  if (match) {
    return {
      accountIndex: parseInt(match[1], 10),
      gemId: match[2]
    };
  }
  return null;
}

/**
 * Validate if a string looks like a Claude project URL
 * @param {string} url 
 * @returns {boolean}
 */
export function isValidClaudeProjectUrl(url) {
  return parseClaudeUrl(url) !== null;
}

/**
 * Validate if a string looks like a Gemini gem URL
 * @param {string} url 
 * @returns {boolean}
 */
export function isValidGeminiGemUrl(url) {
  return parseGeminiUrl(url) !== null;
}

// ============ Model Definitions ============

export const CLAUDE_MODELS = [
  { id: 'opus-4.5', name: 'Opus 4.5', description: 'Most capable for complex work' },
  { id: 'sonnet-4.5', name: 'Sonnet 4.5', description: 'Best for everyday tasks' },
  { id: 'haiku-4.5', name: 'Haiku 4.5', description: 'Fastest for quick answers' }
];

export const GEMINI_MODELS = [
  { id: 'fast', name: 'Fast', description: 'Answers quickly' },
  { id: 'thinking', name: 'Thinking', description: 'Solves complex problems' },
  { id: 'pro', name: 'Pro', description: 'Advanced math & code' }
];