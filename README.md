<div align="center">

# 🎯 heechocha

### The AI Multi-Picker

**Send one prompt. Get answers from multiple AI tools. Compare instantly.**

[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)](https://github.com/Ellebam/heechocha)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/Ellebam/heechocha/releases)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Configuration](#%EF%B8%8F-configuration) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

---

<img src="assets/repo-hero.png" alt="heechocha Hero" width="600">

*One prompt, multiple AI backends, side-by-side comparison*

</div>

## 🤔 Why heechocha?

Ever found yourself copy-pasting the same prompt between Claude, Gemini, ChatGPT, and others just to compare responses? It's tedious, error-prone, and breaks your flow.

**heechocha solves this.** Write your prompt once, pick your AI backends, and launch them all simultaneously. Your prompt is auto-copied to clipboard, tabs are grouped together, and you're ready to paste and compare.

No API keys needed. No costs beyond your existing subscriptions. Just faster AI workflows.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🚀 **Multi-Launch** | Send prompts to Claude and Gemini simultaneously (more backends coming) |
| 📋 **Auto-Copy** | Prompt automatically copied to clipboard for instant pasting |
| 🗂️ **Project Support** | Pre-configure Claude Projects and Gemini Gems for quick access |
| ⚙️ **Model Selection** | Choose specific models (Claude Opus, Sonnet, Gemini Pro, etc.) |
| 📑 **Tab Grouping** | Opened tabs are auto-grouped for easy management |
| 🌙 **Dark Mode** | Native dark theme that matches AI interfaces |
| ⌨️ **Keyboard Shortcuts** | `Ctrl+Enter` / `Cmd+Enter` to launch instantly |
| 💾 **Persistent Settings** | Remember your last prompt and preferences |

---

## 📦 Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ellebam/heechocha.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle **Developer mode** ON (top-right corner)

4. **Load the Extension**
   - Click **"Load unpacked"**
   - Select the cloned `heechocha` folder (where `manifest.json` lives)

5. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin heechocha for quick access

---

## 🚀 Usage

### Basic Flow

```
1. Click the heechocha icon
2. Write your prompt
3. Toggle which AI backends to use
4. Click "Launch Chats" (or Ctrl+Enter)
5. Paste (Ctrl+V) in each opened tab
6. Compare responses side-by-side
```

### Using Projects & Gems

Pre-configure your frequently used Claude Projects and Gemini Gems:

1. Open **Settings** (⚙️ icon)
2. Add your Claude Project URLs under "Claude Projects"
3. Add your Gemini Gem URLs under "Gemini Gems"
4. Select them from dropdowns when launching

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Launch chats |
| `Escape` | Close popup |

---

## ⚙️ Configuration

### Settings Panel

Access via the ⚙️ button in the popup:

| Setting | Description |
|---------|-------------|
| **Auto-close popup** | Close the extension popup after launching tabs |
| **Group tabs** | Auto-group opened AI tabs together |
| **Remember prompt** | Restore your last prompt when reopening |

### Adding Claude Projects

1. In Claude.ai, open your desired Project
2. Copy the URL from the address bar
3. In heechocha Settings → Claude Projects → "Add Project"
4. Paste URL and give it a name

### Adding Gemini Gems

1. In Gemini, open your desired Gem
2. Copy the URL from the address bar
3. In heechocha Settings → Gemini Gems → "Add Gem"
4. Paste URL and give it a name

> **Note:** Gemini URLs include your Google account number (e.g., `/u/6/`). This is extracted automatically to ensure the correct account opens.

---

## 🗺️ Roadmap

We're actively developing heechocha. Here's what's coming:

### v1.1.0 — More Backends
- [ ] ChatGPT support
- [ ] Perplexity support
- [ ] Custom backend configuration

### v1.2.0 — Response Comparison
- [ ] Side-by-side response viewer
- [ ] Response diff highlighting
- [ ] Export comparison results

### Future Ideas
- [ ] Prompt templates & history
- [ ] Batch prompt execution
- [ ] Response quality scoring
- [ ] API mode for power users

Got ideas? [Open an issue](https://github.com/Ellebam/heechocha/issues/new?template=feature_request.md) or [contribute directly](CONTRIBUTING.md)!

---

## 🏗️ Project Structure

```
heechocha/
├── manifest.json           # Chrome extension manifest (v3)
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Styles
│   └── popup.js            # Popup logic
├── background/
│   └── service-worker.js   # Tab management & orchestration
├── content/
│   ├── claude-model-selector.js   # Claude DOM interaction
│   └── gemini-model-selector.js   # Gemini DOM interaction
├── lib/
│   ├── storage.js          # Chrome storage wrapper
│   └── url-builder.js      # URL construction utilities
└── assets/
    └── icon-*.png          # Extension icons
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug fixes, new features, or documentation improvements.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) first.

---

## 🐛 Troubleshooting

<details>
<summary><strong>Extension icon not visible</strong></summary>

Click the puzzle piece icon in Chrome's toolbar and pin heechocha.
</details>

<details>
<summary><strong>Tabs open to login page</strong></summary>

Make sure you're logged into Claude.ai and Gemini in your browser before using the extension.
</details>

<details>
<summary><strong>Wrong Google account for Gemini</strong></summary>

The account is determined by the URL when you add a gem. Delete the old gem and re-add it while logged into the correct account.
</details>

<details>
<summary><strong>Model selection shows warning</strong></summary>

This happens when AI interfaces update their DOM structure. The extension still works — just select the model manually.
</details>

<details>
<summary><strong>Prompt not copying</strong></summary>

Ensure you've granted clipboard permissions. Try clicking Launch again.
</details>

---

## 📄 License

Apache 2.0 — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built for the AI-curious who want to get the most out of every prompt.

---

<div align="center">

**[⬆ Back to Top](#-heechocha)**

Made with ☕ by [Ellebam](https://github.com/Ellebam)

</div>
