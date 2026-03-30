---
name: screenshot
description: Take a screenshot of a page on localhost or a deployed URL using Playwright
user_invocable: true
---

# Screenshot Skill

Take a visual screenshot of a web page for debugging and verification.

## Usage
The user invokes this with `/screenshot` optionally followed by a URL or path.

## Instructions

1. If no URL given, default to `http://localhost:3000`
2. If a path is given (e.g. `/dashboard`), prepend `http://localhost:3000`
3. Use Playwright MCP to:
   - Navigate to the URL
   - Wait for network idle
   - Take a full-page screenshot
4. Show the screenshot to the user
5. Briefly describe what you see — flag any obvious layout issues, broken elements, or empty states

## Example prompts
- `/screenshot` — screenshots localhost:3000
- `/screenshot /dashboard` — screenshots localhost:3000/dashboard
- `/screenshot https://onvero.de` — screenshots the live site
