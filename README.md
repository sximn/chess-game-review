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
bun run test    # PGN, legal replay, API and native/WASM parity tests
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

**Review budgets and move labels are preliminary.** Browser correctness and native builds have been verified, but the requirements' full quality and physical-phone performance/thermal gates are not release-qualified. See [verification and remaining gates](artifacts/frozenight/verification.md).

Frozenight is pinned, vendored and distributed under MIT, including its repository-bundled model. [Engine build instructions, local API and caching policy](engine/frozenight/README.md) document the fork and reproduction. The earlier [Caissa feasibility report](artifacts/caissa-feasibility/decision.md) remains for context; no Caissa code or network is bundled.

```sh
bun run engine:build  # Requires Rust 1.90.0 + wasm32-unknown-unknown
bun run test:browser # Chromium, Firefox, WebKit against the production build
```

## Android and iOS

Native projects have already been added. After a UI change:

```sh
bun run cap:sync
bun run cap:android  # Open in Android Studio
bun run cap:ios      # Open in Xcode
```

Android builds require Android Studio, the configured Android SDK, and a compatible JDK. iOS builds require Xcode with its iOS SDK and a signing team for physical devices. The iOS project uses Swift Package Manager.

The provisional app ID is `com.simonukus.upapawn`; change it and native bundle/application identifiers before distribution. Default generated native app icons and splash screens remain placeholders.

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
src/lib/engine/     Worker API, progressive review, score policy, caching and diagnostics
engine/frozenight/   Pinned MIT/Apache engine, model, Rust bridge and native reference
tests/               PGN, API, parity, failure recovery and production-browser verification
android/             Native Android project
ios/                 Native iOS project
```

Asset attribution is in `THIRD_PARTY_NOTICES.md`.
