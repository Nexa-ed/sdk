---
"create-nexaed-app": minor
---

v0.3.0-beta.0 — What Changed Bug Fix WorkOS middleware was broken for every scaffolded app. The generated middleware.ts was missing redirectUri, causing the auth callback to fail silently. Added redirectUri: process.env.WORKOS_REDIRECT_URI — the env var was already being written to .env.local so no extra setup needed. --- New Features (CLI) Git opt-in - Interactive prompt asks "Initialize a git repository?" (default: yes) - --git / --no-git flags for CI/non-interactive mode - On success: runs git init → git add -A → initial commit - Graceful fallback warning if git isn't installed or commit fails Nexium Labs attribution Generated landing page footer now reads: © {year} {ProjectName} · Built with Nexa Ed — a product by Nexium Labs
