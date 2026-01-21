# Changelog

All notable changes to Hechocha will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- ChatGPT backend support
- Perplexity backend support
- Side-by-side response comparison

---

## [1.0.0] - 2025-01-21

### Added
- 🚀 **Multi-AI Launch**: Send prompts to Claude and Gemini simultaneously
- 📋 **Clipboard Integration**: Auto-copy prompt for easy pasting
- 🗂️ **Project/Gem Support**: Configure Claude Projects and Gemini Gems
- ⚙️ **Model Selection**: Choose specific models for each backend
- 📑 **Tab Grouping**: Auto-group opened AI tabs
- 🌙 **Dark Mode**: Native dark theme
- ⌨️ **Keyboard Shortcuts**: Ctrl+Enter to launch
- 💾 **Persistent Settings**: Remember preferences and last prompt
- 🎯 **Graceful Degradation**: Model selection fails safely, core functionality always works

### Technical
- Chrome Extension Manifest V3
- Content scripts for Claude and Gemini DOM interaction
- Local storage for settings persistence

---

## Version History Legend

| Emoji | Meaning |
|-------|---------|
| 🚀 | New feature |
| 🐛 | Bug fix |
| 📋 | Documentation |
| ⚡ | Performance |
| 🔧 | Configuration |
| 🗑️ | Deprecation |
| 💥 | Breaking change |

[Unreleased]: https://github.com/Ellebam/hechocha/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Ellebam/hechocha/releases/tag/v1.0.0
