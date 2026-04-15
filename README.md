# Vibly Preview

Vibly Preview is a local-first React application for exploring agent chat, AHIP interactive messages, wallet and identity previews, and early public profile flows.

The current build is focused on a single-user browser preview. It does not require a backend service to try the core AHIP experience, and it keeps preview data in the user's browser.

## What You Can Try

- Chat with local AHIP demo agents without an API key.
- Create BYOK agents with an OpenAI-compatible provider, DeepSeek, OpenRouter, or local Ollama-style endpoint.
- Render AHIP v0.2 items through `@ahip/react`.
- Validate AHIP items with `@ahip/core`.
- Generate and persist dynamic AHIP applets, including board-style interactions.
- Save chat history, AHIP items, traces, provider tests, artifact events, secrets, and dynamic applet renderers locally.
- Export preview data as JSON without API keys.
- Edit a local public profile draft on the Me page.
- Preview wallet, identity, contacts, agents, discovery, and chat surfaces.

## Current Scope

This repository is a product preview and protocol playground, not a production wallet or hosted chat service.

In scope:

- Browser-based single-user preview.
- Local IndexedDB persistence through Dexie.
- BYOK provider configuration.
- AHIP protocol validation and rendering.
- LangGraph-based agent runtime for LLM-backed preview agents.
- Local demo scenarios for users without API keys.
- Tauri shell scaffolding for future desktop packaging.

Out of scope for this phase:

- Server-side sync.
- Multi-user messaging.
- Production wallet transactions.
- Real chain writes.
- Account login.
- Cross-device history.
- JSON import.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Dexie / IndexedDB
- LangGraph.js
- AI SDK provider adapters
- `@ahip/core`
- `@ahip/react`
- Vitest, jsdom, and React Testing Library
- Tauri 2 scaffolding

## Requirements

Use a recent Node.js version. Node 22 LTS is recommended for local development and tests.

```bash
node --version
npm --version
```

If you develop inside WSL, prefer a Linux Node.js installation inside WSL. Mixing Windows Node/npm with a WSL working directory can cause Rollup/Vitest optional dependency and UNC path issues.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the web preview:

```bash
npm run dev
```

The dev server uses:

```text
http://localhost:1420
```

Build the web app:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Preview a production build:

```bash
npm run preview
```

## AHIP Preview

AHIP is the protocol layer for structured, interactive agent responses.

The preview follows this flow:

1. A user sends a message.
2. The runtime builds context from the session, host capabilities, and AHIP skill manifest.
3. The agent decides whether to return plain text, an AHIP item, or a tool intent.
4. AHIP output is normalized and validated with `@ahip/core`.
5. Valid AHIP items are stored in IndexedDB.
6. The UI renders AHIP items with `@ahip/react`.
7. User actions are routed back through the runtime instead of mutating UI state directly.
8. Dynamic applets are registered as host renderers and persisted locally.

The AHIP skill is generic. It is not tied to a specific game or workflow. Board games, forms, approvals, payment previews, tools, artifacts, status blocks, and custom widgets are all treated as examples of the same protocol capability.

## Local Demo Mode

Users can try the AHIP experience without creating an agent or entering an API key.

Local demo mode uses a scenario matrix that covers plain text, markdown, forms, tables, charts, entity cards, status, errors, approvals, payment previews, tool intents, tool results, artifacts, state patches, unsupported fallback, and widget interactions.

This makes the preview deterministic and suitable for regression testing even when no LLM provider is configured.

## BYOK Agents

Users can create local preview agents from the Agents page. API keys are stored only in the current browser's IndexedDB.

Currently exposed provider presets:

- OpenAI compatible
- DeepSeek
- OpenRouter
- Ollama

The runtime also contains adapter-level support or planned types for additional providers such as Anthropic, Gemini, LM Studio-style compatible endpoints, and WebLLM. Provider UI exposure may lag behind adapter capabilities.

Secrets are kept separate from messages and AHIP items. JSON exports intentionally exclude API keys.

## Local Persistence

The AHIP preview stores data in IndexedDB under the local browser profile.

Stored locally:

- Agents
- Sessions
- Messages
- AHIP items
- Runtime traces
- Provider test results
- Artifact open events
- Dynamic applet renderers
- API keys in a separate secrets store

Exported JSON includes preview data needed for debugging and review, but does not include API keys.

Resetting the preview clears local AHIP preview state, including dynamic applets and secrets.

## Project Structure

```text
src/
  assets/                 Static image assets and avatars
  components/             Shared UI, layout, chat, wallet, and AHIP renderers
  hooks/                  Shared React hooks
  i18n/                   English and Chinese UI messages
  lib/                    App context, navigation, and shared utilities
  mock/                   Lightweight legacy preview data
  modules/
    ahip-preview/         AHIP runtime, storage, skill manifest, scenarios, providers
    agents/               Agent domain types
    content/              Content schemas
    identity/             Identity domain types
    mvp/                  Local MVP state provider and persistence
    notifications/        Notification types
    profile/              Profile domain types
    relations/            Relationship types
    wallet/               Wallet preview types
  pages/                  App pages
  router/                 Route definitions
  styles/                 Global styles
  test/                   Test setup
src-tauri/                Tauri shell scaffold
apps/dev-gateway/         Local development gateway scaffold
docs/                     Early product and preview planning notes
```

## Internationalization

The app includes English and Simplified Chinese message dictionaries.

The language is selected from:

1. The saved `vibly-locale` value in `localStorage`.
2. The browser language.
3. English fallback when no browser language is available.

The primary navigation uses i18n keys. Preview mock data is kept in English so the default product walkthrough is broadly readable.

## Tauri

The repository includes a Tauri 2 scaffold:

```bash
npm run tauri:dev
npm run tauri:build
```

The main acceptance target for this phase is the browser preview. Desktop packaging can be hardened after the web flow stabilizes.

## Useful Commands

```bash
npm run dev
npm test
npm run build
npm run preview
```

## Privacy Notes

Vibly Preview is local-first in this phase.

- API keys are stored only in the browser's local IndexedDB secrets store.
- API keys are not written to AHIP items, runtime traces, artifacts, widget props, or JSON exports.
- Chat history is local to the current browser profile.
- Users should not paste API keys, private keys, or wallet secrets into chat messages.

## Development Notes

- AHIP protocol truth belongs to `@ahip/core`.
- AHIP rendering belongs to `@ahip/react`.
- UI components should render validated protocol objects instead of inventing protocol state.
- Widget and applet interactions should return actions through the host runtime.
- Dynamic applet HTML is stored as local host renderer data, not inside AHIP items.
- The local demo scenario matrix is the source of truth for deterministic AHIP preview coverage.
