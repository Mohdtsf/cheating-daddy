````markdown
<img width="1299" height="424" alt="cd (1)" src="https://github.com/user-attachments/assets/b25fff4d-043d-4f38-9985-f832ae0d0f6e" />

# Cheating Daddy

A real-time AI assistant that provides contextual help during video calls, interviews, presentations, and meetings using screen capture and audio analysis.

> NOTE: This repo contains two renderer implementations:

-   Legacy (Lit) renderer: original app UI (located under `src/components` and root `index.html`).
-   New React + Tailwind renderer: modern UI using React + Vite (located under `src/renderer`).

Both renderers are available. Electron will load the React dev server in development when instructed (see below), and will load the production-built renderer when running in production.

---

## Features

-   Live AI Assistance (Google Gemini integration)
-   Screen & Audio Capture
-   Multiple Profiles (Interview, Sales, Meeting, etc.)
-   Transparent overlay window with click-through mode
-   Cross-platform: macOS, Windows, Linux

## Quick Setup

1. Get a Gemini API Key: Visit https://aistudio.google.com/apikey
2. Install dependencies:

```powershell
npm install
```
````

3. See "Run the app" below for renderer-specific run/build instructions.

## Running the app — renderer options

This project can run the legacy Lit renderer or the React+Tailwind renderer. The main process (`src/utils/window.js`) picks what to load:

-   If the environment variable `ELECTRON_START_URL` is set (or NODE_ENV=development depending on your setup), Electron will load that URL (commonly the Vite dev server for the React renderer).
-   In production it prefers the built renderer at `dist/index.html`. If `dist/index.html` is missing it falls back to the repository `index.html` which contains the Lit UI.

Below are recommended commands for both renderers.

### Run React + Tailwind renderer (development, with HMR)

1. Start the Vite dev server (this serves the React frontend at http://localhost:5173 by default):

```powershell
npm run dev:renderer
```

2. In another PowerShell terminal, set the environment variable and start Electron so it loads the dev server:

```powershell
$env:ELECTRON_START_URL = 'http://localhost:5173'; npm start
```

This lets you develop the React UI with HMR while running the Electron main process.

### Run React + Tailwind renderer (production build)

1. Build the renderer bundle:

```powershell
npm run build:renderer
```

2. Start the packaged Electron app (this will load `dist/index.html`):

```powershell
npm start
```

### Run the legacy Lit renderer

If you prefer to run the original Lit-based UI, simply ensure Electron is not pointed at the Vite dev server (don't set `ELECTRON_START_URL`) and start the app. Electron will load `dist/index.html` if present or fall back to the repository `index.html` which contains the Lit UI.

```powershell
npm start
```

Note: if you previously built the React renderer (`dist/index.html` exists), Electron will load that file first. Remove or rename `dist/index.html` if you want to force the legacy `index.html` to be loaded.

## Security notes

-   The app uses a secure preload bridge (`src/preload.js`) and the BrowserWindow is configured with `nodeIntegration: false` and `contextIsolation: true`. Prefer using the preload APIs (`window.electron.ipcRenderer.invoke/send/on`) instead of `window.require` from the renderer.
-   The code also supports a compatibility shim (`window.cheddar`) for non-isolated environments; when possible prefer the secure preload.

## Important scripts

-   `npm run dev:renderer` — start Vite for the React renderer (development)
-   `npm run build:renderer` — build the React renderer into `dist/`
-   `npm start` — start Electron (main process). If `ELECTRON_START_URL` is set Electron will try to load that URL first.

Optionally you can add a convenience script to run both dev server and Electron concurrently (example using `concurrently`):

```json
"scripts": {
  "dev:renderer": "vite",
  "start:dev": "concurrently \"npm:dev:renderer\" \"cross-env ELECTRON_START_URL=http://localhost:5173 npm start\""
}
```

## Customize view, transparency and window resizing

-   The Customize view (settings) updates CSS variables for transparency and font size using the same root variables used by the app. The slider in the Customize view updates `--header-background`, `--main-content-background`, `--card-background`, and related variables so changes are immediate.
-   When layout or advanced mode changes the renderer calls an IPC `update-sizes` which triggers the main process to resize the BrowserWindow to match the view. This is handled by `src/utils/windowResize.js` (used in the React renderer) and main-process `ipcMain.handle('update-sizes', ...)`.

## Troubleshooting

-   If the React dev server doesn't start on `localhost:5173`, check the terminal output for port conflicts and adjust the dev server port in `vite.config.js`.
-   Your editor may show "Unknown at rule @tailwind" for `@tailwind` directives in `src/renderer/src/styles.css`. That's a linter/IDE issue; Vite/PostCSS handles these at build time. Ignore this warning if the dev server runs correctly.
-   If Electron loads a different renderer than expected, check the `ELECTRON_START_URL` environment variable and whether `dist/index.html` exists.
-   If key shortcuts or window resize do not work, confirm the app has permission and that the preload bridge is enabled (main process sets preload path). The app supports three IPC fallback paths: secure preload, legacy `require('electron')`, and `window.cheddar` shim.

## Development notes

-   Renderer code (React/Tailwind) lives in `src/renderer/`.
-   Legacy Lit components live in `src/components/` and are still present for parity/reference.
-   Main process and window creation logic live in `src/index.js` and `src/utils/window.js`.

---

If you'd like, I can add a `start:dev` script to the repository to run both the Vite dev server and Electron together cross-platform — tell me if you want that and I'll add it.

```<img width="1299" height="424" alt="cd (1)" src="https://github.com/user-attachments/assets/b25fff4d-043d-4f38-9985-f832ae0d0f6e" />

## Recall.ai - API for desktop recording

If you’re looking for a hosted desktop recording API, consider checking out [Recall.ai](https://www.recall.ai/product/desktop-recording-sdk/?utm_source=github&utm_medium=sponsorship&utm_campaign=sohzm-cheating-daddy), an API that records Zoom, Google Meet, Microsoft Teams, in-person meetings, and more.

This project is sponsored by Recall.ai.

---

> [!NOTE]
> Use latest MacOS and Windows version, older versions have limited support

> [!NOTE]
> During testing it wont answer if you ask something, you need to simulate interviewer asking question, which it will answer

A real-time AI assistant that provides contextual help during video calls, interviews, presentations, and meetings using screen capture and audio analysis.

## Features

- **Live AI Assistance**: Real-time help powered by Google Gemini 2.0 Flash Live
- **Screen & Audio Capture**: Analyzes what you see and hear for contextual responses
- **Multiple Profiles**: Interview, Sales Call, Business Meeting, Presentation, Negotiation
- **Transparent Overlay**: Always-on-top window that can be positioned anywhere
- **Click-through Mode**: Make window transparent to clicks when needed
- **Cross-platform**: Works on macOS, Windows, and Linux (kinda, dont use, just for testing rn)

## Setup

1. **Get a Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. **Install Dependencies**: `npm install`
3. **Run the App**: `npm start`

## Usage

1. Enter your Gemini API key in the main window
2. Choose your profile and language in settings
3. Click "Start Session" to begin
4. Position the window using keyboard shortcuts
5. The AI will provide real-time assistance based on your screen and what interview asks

## Keyboard Shortcuts

- **Window Movement**: `Ctrl/Cmd + Arrow Keys` - Move window
- **Click-through**: `Ctrl/Cmd + M` - Toggle mouse events
- **Close/Back**: `Ctrl/Cmd + \` - Close window or go back
- **Send Message**: `Enter` - Send text to AI

## Audio Capture

- **macOS**: [SystemAudioDump](https://github.com/Mohammed-Yasin-Mulla/Sound) for system audio
- **Windows**: Loopback audio capture
- **Linux**: Microphone input

## Requirements

- Electron-compatible OS (macOS, Windows, Linux)
- Gemini API key
- Screen recording permissions
- Microphone/audio permissions
```
