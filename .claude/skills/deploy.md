---
name: deploy
description: Deploy the website to preview or production
user_invocable: true
---

# Deploy Skill

Deploy the Onvero website.

## Usage
The user invokes this with `/deploy` optionally followed by `preview` or `production`.

## Instructions

1. Default to `preview` if no argument given
2. Ensure all changes are committed (check `git status`)
3. Run `npx tsc --noEmit` to verify no TypeScript errors
4. For preview: run `npx vercel` (or the project's deploy command)
5. For production: run `npx vercel --prod` — ask for confirmation first
6. Show the deployment URL when done
7. If Vercel is not configured, inform the user and suggest setup steps

## Notes
- Always type-check before deploying
- Never deploy to production without explicit user confirmation
- Show the preview URL so the user can verify
