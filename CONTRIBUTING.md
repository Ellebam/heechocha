# Contributing to Hechocha

First off, thanks for considering contributing to Hechocha! 🎉

## Quick Start

1. Fork the repo
2. Clone your fork
3. Load the extension in Chrome (`chrome://extensions/` → Developer mode → Load unpacked)
4. Make your changes
5. Test thoroughly
6. Submit a PR

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hechocha.git
cd hechocha

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the hechocha folder
```

No build step required — it's vanilla JavaScript.

## What We're Looking For

### 🐛 Bug Fixes
Found a bug? Fix it and submit a PR. Include:
- What was broken
- How you fixed it
- How to test the fix

### ✨ New Features
Check the [roadmap](README.md#-roadmap) for planned features. Before working on something big:
1. Open an issue to discuss it first
2. Get a thumbs up from maintainers
3. Then start coding

### 📚 Documentation
Docs can always be better. Typos, clarifications, examples — all welcome.

### 🎨 UI/UX Improvements
The popup should be clean, fast, and intuitive. Suggestions welcome.

## Code Style

Keep it simple:
- Vanilla JavaScript (no frameworks)
- Clear variable names
- Comments for non-obvious logic
- Consistent formatting (2-space indents)

## Commit Messages

Use clear, descriptive commit messages:

```
✅ Good:
- Add ChatGPT backend support
- Fix model selector failing on Gemini update
- Update README installation steps

❌ Bad:
- fix stuff
- updates
- wip
```

## Pull Request Process

1. **Branch naming**: `feature/thing` or `fix/thing`
2. **PR title**: Clear description of what it does
3. **PR description**: Include:
   - What changed
   - Why it changed
   - How to test it
   - Screenshots if UI changed

4. **Keep PRs focused**: One feature/fix per PR
5. **Test before submitting**: Load the extension and verify it works

## Testing Checklist

Before submitting, verify:
- [ ] Extension loads without errors
- [ ] Claude launch works
- [ ] Gemini launch works
- [ ] Tab grouping works
- [ ] Clipboard copy works
- [ ] Settings save/load correctly
- [ ] No console errors

## Questions?

Open an issue with the `question` label.

---

Thanks for helping make Hechocha better! 🚀
