# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in heechocha, please report it by opening a private issue or contacting the maintainer directly.

**Please do not open a public issue for security vulnerabilities.**

## Security Considerations

heechocha is designed with privacy in mind:

- **No data collection**: Settings are stored locally in Chrome storage only
- **No external API calls**: The extension makes no network requests except to open AI service tabs
- **No content injection**: The extension does not read or modify page content beyond model selection
- **Minimal permissions**: Only requests permissions necessary for core functionality

## Permissions Used

| Permission | Purpose |
|------------|---------|
| `storage` | Save user settings locally |
| `clipboardWrite` | Copy prompt to clipboard |
| `tabs` | Open and manage AI service tabs |
| `tabGroups` | Group opened tabs together |

## Third-Party Services

heechocha opens tabs to:
- claude.ai (Anthropic)
- gemini.google.com (Google)

These services have their own privacy policies. heechocha does not transmit any data to these services — it only opens tabs and copies your prompt to your local clipboard.
