# Dual AI Chat Launcher

A lightweight Chrome extension that helps you send the same prompt to both Claude and Gemini simultaneously for side-by-side AI response comparison.

## Features

- 📝 **Single prompt input** — Write once, send to both services
- 📋 **Clipboard integration** — Prompt automatically copied for easy pasting
- 🗂️ **Project/Gem support** — Configure your Claude Projects and Gemini Gems
- ⚙️ **Model selection** — Choose which model to use on each service
- 🎯 **Tab grouping** — Opened tabs are grouped together for easy management
- 🌙 **Dark mode** — Easy on the eyes, matches both AI interfaces

## How It Works

1. Enter your prompt in the extension popup
2. Select which services to use (Claude, Gemini, or both)
3. Optionally select a specific Project or Gem
4. Choose the desired model for each service
5. Click "Launch Chats"
6. The extension copies your prompt and opens new tabs
7. **Model auto-selection** attempts to set your chosen model (see below)
8. Paste (Ctrl+V / Cmd+V) in each chat and submit

### Model Selection Feature

The extension attempts to automatically select your chosen model in each chat interface. This feature:

- ✅ **Works when it works** — If the UI elements are found, models are selected automatically
- ⚠️ **Fails gracefully** — If selection fails, you'll see a warning but the extension continues working
- 🔄 **May need manual selection** — If you see "select model manually", just pick the model yourself

Model selection can fail if Claude or Gemini update their interfaces. The core functionality (opening tabs + copying prompt) always works regardless.

> **Note:** The extension opens tabs and copies your prompt. If model auto-selection fails, simply select the model manually in each chat before submitting.

## Installation

### Step 1: Download the Extension

Download or clone this repository to a folder on your computer.

### Step 2: Open Chrome Extensions

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Or go to Menu (⋮) → Extensions → Manage Extensions

### Step 3: Enable Developer Mode

1. In the top-right corner, toggle **Developer mode** ON
2. You should see additional buttons appear: "Load unpacked", "Pack extension", etc.

### Step 4: Load the Extension

1. Click **"Load unpacked"**
2. Navigate to the folder containing this extension (where `manifest.json` is located)
3. Select the folder and click "Open" or "Select Folder"

### Step 5: Verify Installation

1. You should see "Dual AI Chat Launcher" in your extensions list
2. The extension icon (⚡) should appear in your Chrome toolbar
3. If you don't see the icon, click the puzzle piece icon (Extensions) and pin the extension

## Initial Setup

### Adding Claude Projects

1. Click the extension icon to open the popup
2. Click the **⚙️ Settings** button (top-right)
3. Under "Claude Projects", click **"+ Add Project"**
4. In Claude.ai, open the project you want to add
5. Copy the URL from your browser's address bar
6. Paste the URL into the extension and give it a name
7. Click **Save**

### Adding Gemini Gems

1. In the Settings panel, under "Gemini Gems", click **"+ Add Gem"**
2. In Gemini, open the gem you want to add
3. Copy the URL from your browser's address bar
4. Paste the URL into the extension and give it a name
5. Click **Save**

> **Important:** The Gemini URL includes your Google account number (e.g., `/u/6/`). This is extracted automatically and used to ensure the extension opens the correct account.

## Usage

### Basic Usage

1. Click the extension icon
2. Type your prompt in the text area
3. Make sure both Claude and Gemini toggles are enabled
4. Click **🚀 Launch Chats**
5. Two tabs will open — paste your prompt in each and submit

### Using Projects/Gems

1. Select a project from the "Project" dropdown for Claude
2. Select a gem from the "Gem" dropdown for Gemini
3. Launch as usual — tabs will open to the correct project/gem

### Keyboard Shortcut

- **Ctrl+Enter** (or **Cmd+Enter** on Mac) — Launch chats from the prompt input

### Preferences

Access via Settings (⚙️):

- **Auto-close popup after launch** — Automatically closes the popup after opening tabs
- **Group opened tabs together** — Groups Claude and Gemini tabs in a tab group
- **Remember last prompt** — Restores your last prompt when you reopen the extension

## File Reference

The "Files to attach" field is a reminder for yourself. Since the extension cannot automatically upload files, use this field to note which files you need to manually attach in each chat.

## Troubleshooting

### Extension icon not visible
Click the puzzle piece icon in Chrome's toolbar and pin the Dual AI Launcher extension.

### Tabs open to login page
Make sure you're logged into both Claude.ai and Gemini in your browser before using the extension.

### Wrong Google account for Gemini
The account is determined by the URL when you add a gem. If you need a different account:
1. Log into the correct Google account in Chrome
2. Open Gemini with that account
3. Delete the old gem configuration
4. Add it again with the new URL

### Model selection shows warning
This is expected behavior when the UI has changed. The extension will show "⚠ select model manually" but still works. Just select the model yourself in the chat.

### Model selection never completes
The extension waits up to 8 seconds for the page to load. On slow connections, this might timeout. The chat still opens and works.

### Prompt not copying
Make sure you've granted clipboard permissions. Try clicking the Launch button again.

## Privacy & Security

- **No data collection** — The extension stores settings locally only
- **No network requests** — The extension makes no external API calls
- **No content injection** — The extension does not read or modify web pages
- **Minimal permissions** — Only storage, clipboard, and tab creation

## Development

See `DEVELOPMENT_SPEC.md` for technical documentation.

### File Structure

```
dual-ai-launcher/
├── manifest.json           # Extension manifest
├── popup/
│   ├── popup.html          # UI markup
│   ├── popup.css           # Styles
│   └── popup.js            # Logic
├── background/
│   └── service-worker.js   # Tab management
├── content/
│   ├── claude-model-selector.js   # Claude model selection
│   └── gemini-model-selector.js   # Gemini model selection
├── lib/
│   ├── storage.js          # Chrome storage wrapper
│   └── url-builder.js      # URL utilities
├── assets/
│   └── icon-*.png          # Extension icons
└── README.md               # This file
```

## Version History

### v1.1.0
- **Model auto-selection** — Extension attempts to select chosen model in each chat
- Graceful degradation — Model selection failures show warning but don't break functionality
- Content scripts for Claude and Gemini DOM interaction

### v1.0.0
- Initial release
- Claude and Gemini support
- Project/Gem configuration
- Model selection (display only)
- Tab grouping
- Preferences

## License

MIT License — Use freely, modify as needed.
