# Up a Pawn

A chess game review app for web, Android, and iOS, with on-device engine analysis and offline support.

Import a PGN, review move classifications and legal alternatives, and track evaluations throughout the game. Games and analysis stay on your device.

> **Status: early / pre-release.** Review budgets and classification thresholds are preliminary, and native behavior has not been validated on physical devices. See [Known limitations](#known-limitations).

<!-- TODO: screenshot or GIF of the review screen:
![Review screen](docs/screenshot-review.png)
-->

<!-- TODO: **[Live demo →](https://your-url)** -->

## Features

- Local Frozenight WASM analysis with move classifications, legal alternatives, and an evaluation graph.
- PGN paste and file import, including games with custom FEN starting positions.
- A simple welcome screen before your first import, then an on-device game library with results, search, and device-local review links (`/review?game=<local-id>`).
- Move navigation, autoplay, board flip, timeline scrubbing, and move selection.
- Responsive layouts, light/dark themes, and saved board preferences.
- Offline web support and bundled native assets. No runtime asset CDN.

Keyboard shortcuts work while the page body has focus: Left/Right to navigate, Home/End to jump to the first/last move, and Space to toggle autoplay.

The move rating stays visible in a paper card below the board. When the played move was not best, a soft card beside it shows the best move. Tap that card to preview its board arrow and reveal the option to explore the line. The Analysis button opens the full review on smaller screens. Technical engine details (preliminary/refined labels, depths, nodes, and measured loss) are visible only with `?analysis=detail`.

## Run locally

Requires Node.js 22.12+ and Bun 1.4+.

```sh
bun install
bun run dev
```

Open [localhost:5173](http://localhost:5173).

## Development

```sh
bun run check         # Svelte and TypeScript diagnostics
bun run test          # PGN, review scheduling, classification, and cache tests
bun run test:browser  # Chromium, Firefox, and WebKit against a production build
bun run build         # Static SPA in build/
```

`test:browser` uses Playwright. If the browsers aren't installed yet, run `bunx playwright install` first.

### Stack

- **Svelte 5, SvelteKit, TypeScript, and Vite.** Client-side rendering with `adapter-static`.
- **Bits UI.** Accessible UI primitives with component-scoped styling.
- **Capacitor 8.** Checked-in Android and iOS projects sharing the web build and routes.
- **chess.js.** PGN parsing and legal position replay.
- **chess-engine-kit.** Prebuilt Frozenight WASM engine and module worker (version pinned in `package.json`).

Fonts, icons, and chess pieces are bundled locally. For static web hosting, rewrite unknown application paths to `/index.html`.

### Analysis and storage

Analysis prioritizes the selected position, then reviews the full game and refines uncertain positions. Reviews support pause, resume, and retry.

The engine provider is configured in `src/lib/engine/provider.ts` through `createFrozenight()`. Vite handles the SDK's worker, WASM, notices, and metadata in development and production. App developers do not need Rust, Docker, or a separate asset-copy step.

Analysis results are cached in IndexedDB. Cache keys include position history, engine identity, settings, review budget, and classification policy. Cached results are validated before reuse.

The web service worker caches the app shell and engine assets. Browser tests verify that another game can complete after an offline reload. Capacitor ships these assets inside the app.

Engine source, builds, parity checks, reproducibility, and engine notices are maintained in [chess-engine-kit](https://github.com/sximn/chess-engine-kit).

## Android and iOS

Native projects are included. After a UI change:

```sh
bun run cap:build:sync
bun run cap:android  # Open in Android Studio
bun run cap:ios      # Open in Xcode
```

Android requires Android Studio, the configured Android SDK, and a compatible JDK. iOS requires Xcode and its iOS SDK, plus a signing team for physical devices. The iOS project uses Swift Package Manager.

**Before distributing:** the app ID `com.simonukus.upapawn` is provisional, so change it along with the native bundle and application identifiers. Generated splash screens are still placeholders.

The app icons use the artwork from `favicon-candidate/`: web favicons, the Apple touch icon, and PWA icons are in `static/`, with their links in `src/app.html` and `static/site.webmanifest`. Android launcher and adaptive icons are in `android/app/src/main/res/` at all five densities, with the supplied dark background. The opaque 1024px iOS icon is in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`. Native icon changes require a rebuild and reinstall. The optional dynamic favicon script and environment badges are not published.

Native integration lives in `src/lib/native.ts`:

- Android Back closes an open menu or dialog, then follows WebView history, then minimizes the app at the root.
- System bar styling follows the selected theme.
- Keyboard resizing, safe-area insets, and lifecycle events are handled by the shared shell.
- Autoplay pauses when the document becomes hidden.

## Known limitations

- Review quality and device performance are still being validated. Review budgets and classification thresholds are preliminary.
- Physical-device latency, memory use, energy consumption, and thermal behavior need further testing.
- iOS finger-following swipe-back is not implemented.
- Keyboard behavior, cutouts, rotation, system back, and export/download behavior still need device validation.

## Project structure

```text
src/lib/components/      ui/, app/, replay/, analysis/, and games/ components
src/lib/chess.ts         PGN parsing and legal position timeline
src/lib/state.svelte.ts  Shared state and local persistence
src/lib/native.ts        Capacitor integration
src/lib/engine/          Engine provider, review logic, cache, and diagnostics
src/lib/styles.css       Global styles entry point
src/lib/styles/          Foundation and reduced-motion defaults
src/routes/              Review, library, insights, preferences, and error pages
tests/                   Unit and production-browser verification
android/                 Native Android project
ios/                     Native iOS project
```

See [the components guide](src/lib/components/README.md) for folder responsibilities and import conventions.

## Diagnostics and verification

Runtime diagnostics are available at `/diagnostics`. Verification reports are generated in `artifacts/app-verification/`.

The Best move card previews the suggested move with an arrow and smoothly reveals its move list below it. The controls lift to make room only while the line is open; click any step to explore it. The game timeline stays anchored to the reviewed move. Next, Previous, playback, or a game move chip returns to the original game; Escape returns without advancing.

While exploring an alternative line, the board is softly dimmed and outlined in violet. The effect clears when returning to the game.

Compare packaged native web assets with `build/`:

```sh
node scripts/verify-native-assets.mjs --android
node scripts/verify-native-assets.mjs --ios /absolute/path/to/App.app
```

## License

Licensed under the [Apache License 2.0](LICENSE).

Third-party asset attribution is in `THIRD_PARTY_NOTICES.md`. Engine notices are maintained in [chess-engine-kit](https://github.com/sximn/chess-engine-kit).
