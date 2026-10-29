# Up a Pawn

A warm, tactile chess review UI for web, Android, and iOS. Built from the supplied **Up a Pawn** design system: cream surfaces, sage chessboards, buttery yellow actions, violet feedback, subtle depth, and reduced-motion support.

## Run locally

Requires Node.js 22.12+ and Bun 1.4+.

```sh
bun install
bun run dev
```

Open [localhost:5173](http://localhost:5173).

```sh
bun run check   # Svelte and TypeScript diagnostics
bun run test    # PGN, review scheduling, classification and cache tests
bun run build  # Static SPA in build/
```

## Stack and architecture

- **Svelte 5 + SvelteKit 3**, TypeScript, Vite. The root layout sets `ssr = false`. `adapter-static` emits `build/index.html` as the SPA fallback. Static web hosts should rewrite unknown application paths to `/index.html`.
- **Bits UI** for accessible tabs, modal dialogs, dropdown menus, and switches. Styling lives in our components and CSS; this keeps the supplied design language independent of a mobile framework's router.
- **Capacitor 8**, including checked-in Android and iOS projects. Both platforms use the same static build and SvelteKit routes.
- **chess.js** for PGN parsing and legal game positions. Every half-move maps to a FEN, including custom FEN starting positions.
- Local Fontsource fonts, Lucide icons, and locally bundled chess SVGs. No runtime asset CDN is required.

## What works

- Opera Game and imported-game reviews with local Frozenight WASM analysis, move classifications, legal alternatives, and an evaluation graph.
- First/previous/next/last move, autoplay, board flip, timeline scrubbing, and move selection. Keyboard: left/right arrows, Home/End, Space to play while the page body has focus.
- PGN paste or file import with validation, an on-device game library, search, filters, and shareable local review URLs (`/?game=<local-id>`).
- Light/dark themes and coordinate/evaluation preferences, saved on this device.
- Mobile bottom navigation, import bottom sheet, safe-area layout, and reduced-motion handling.

The review workspace fits the board and controls inside the viewport without page scrolling. A primary Next button and Previous button flank a scrollable move carousel; first/last and autoplay are grouped separately. On phones the controls stay near the bottom navigation. Analysis appears beside the board only at widths of 1200px or more and heights of 620px or more; otherwise an Analysis button opens an accessible sheet. Choosing a move from the sheet returns to the board. Desktop analysis scrolls independently. Landscape phones use a compact navigation rail.

Overview, Moves, and Evaluation use real engine results. The worker prioritizes the selected position, then reviews the whole game and refines uncertain moments. Pause/resume and typed retry states remain available. All game content stays on the device. The web app installs an offline shell; Capacitor bundles the assets at build time.

**Review budgets and move labels are preliminary.** The app owns review scheduling, classification thresholds and device performance qualification. Engine correctness does not establish review accuracy or physical-phone performance/thermal suitability.

Local analysis uses the exact npm dependency `chess-engine-kit@0.0.1`, which ships a prebuilt Frozenight WASM engine and module worker. App developers need neither Rust nor Docker. `dev` and `build` run the package's asset-copy CLI into the ignored `static/engines/frozenight/` directory; the build includes those assets in the offline shell and Capacitor bundle.

```sh
bun run engine:assets # Copy and verify the package's engine, worker and notices
bun run test:browser  # Chromium, Firefox and WebKit against a production build
```

`src/lib/engine/provider.ts` selects the SDK provider and asset URL. Review logic uses the public `ChessEngine` interface. The app's IndexedDB result cache keys include the full position/history, SDK identity and adapter/model hashes, settings, budget and classification policy. Cached records are checked for valid identity, schema and legal continuations before reuse. Previous vendored-engine cache entries are excluded by the new `upapawn-analysis-v2` namespace.

The SDK caches verified WASM bytes; the app's service worker caches the page, application chunks, SDK worker, WASM and notices. Browser tests verify a different game completes after an offline reload. On Capacitor, all assets are shipped inside the application.

Runtime diagnostics are at `/diagnostics`. Browser and native verification reports are generated under `artifacts/app-verification/`. The native asset verifier compares every final APK/.app web asset with `build/`:

```sh
node scripts/verify-native-assets.mjs --android
node scripts/verify-native-assets.mjs --ios /absolute/path/to/App.app
```

Engine source/build/parity/reproducibility and notice maintenance belong to [chess-engine-kit](https://github.com/sximn/chess-engine-kit). This app retains full-game review, legal replay, classification, retry/pause, storage recovery, offline and native packaging checks. Physical-device latency, sustained memory/energy/thermal behavior and review-quality acceptance still need application-level qualification.

## Android and iOS

Native projects have already been added. After a UI change:

```sh
bun run cap:sync
bun run cap:android  # Open in Android Studio
bun run cap:ios      # Open in Xcode
```

Android builds require Android Studio, the configured Android SDK, and a compatible JDK. iOS builds require Xcode with its iOS SDK and a signing team for physical devices. The iOS project uses Swift Package Manager.

### Shared mobile shell

`src/lib/native.ts` owns native integration. Android Back closes an open menu or dialog first, then follows WebView history, then minimizes at the root. Plugin listeners are removed on teardown. The keyboard uses native viewport resizing; CSS hides bottom navigation when the keyboard appears. System bar style follows the selected theme. Autoplay pauses when the document becomes hidden.

Insets are handled once: Capacitor SystemBars uses `insetsHandling: 'native'` with Android edge-to-edge enabled; CSS consumes `env(safe-area-inset-*)`. On older WebViews Capacitor applies native padding and reports zero CSS insets. The viewport uses `viewport-fit=cover`.

iOS finger-following swipe-back is not implemented. Device validation remains necessary for keyboards, cutouts, landscape rotation, system back, and native export/download behavior.

## Project map

```text
src/lib/components/  Scoped UI components, shared actions/dialogs, shell and navigation
src/lib/chess.ts     PGN parsing and legal position timeline
src/lib/state.svelte.ts  Shared reactive state and local persistence
src/lib/native.ts    Capacitor lifecycle, back policy, system bars
src/lib/styles.css   Tokens/reset/accessibility and reduced-motion CSS entry point
src/lib/styles/      Only foundation and reduced-motion defaults; UI styles are scoped
src/routes/          Review, game library, insights, preferences and error fallback
src/lib/engine/      SDK provider, progressive review, score policy, cache guards and diagnostics
static/engines/       Generated SDK worker, WASM, manifests and notices (ignored)
tests/               PGN, review policy, cache, failure recovery and production-browser verification
android/             Native Android project
ios/                 Native iOS project
```

Asset attribution is in `THIRD_PARTY_NOTICES.md`.
