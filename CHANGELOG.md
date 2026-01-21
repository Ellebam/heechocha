# Changelog

All notable changes to heechocha will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Perplexity backend support
- Side-by-side response comparison

---

## [1.1.0] - 2026-01-21

### Added
- 🚀 **ChatGPT Support**: Launch prompts to ChatGPT with model selection
- 🎨 **Service Logos**: Added official-style logos for Claude, Gemini, and ChatGPT
- 🔘 **Independent Toggles**: Each service (Claude, Gemini, ChatGPT) can be enabled/disabled independently

### Fixed
- 🐛 **Gemini Multiline Prompts**: Fixed multiline text not being inserted correctly into Gemini's editor
- 🐛 **Gemini Single Account**: Fixed URL parsing for users with a single Google account (no `/u/X` in URL)
- 🔧 **Claude Model Selection**: Improved reliability of automatic model selection

### Technical
- Content script for ChatGPT DOM interaction
- Updated URL builder to support ChatGPT
- Relaxed Gemini URL parsing regex

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

[Unreleased]: https://github.com/Ellebam/heechocha/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Ellebam/heechocha/releases/tag/v1.0.0
