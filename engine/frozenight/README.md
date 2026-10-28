# Frozenight browser engine

The app owns a small fork of [Frozenight at f4d5a00725b2cd5f1c32910d57a84c77b66cc670](https://github.com/MinusKelvin/frozenight/tree/f4d5a00725b2cd5f1c32910d57a84c77b66cc670). The original core and its bundled `model.json.zst` are distributed under the repository's MIT OR Apache-2.0 terms; Up a Pawn elects MIT. Original notices are retained. The bridge is MIT. No Caissa/Stockfish code, external network, tablebases, remote evaluation service, or GPL engine dependency is used.

`dependencies.json` lists the 23 locked Cargo dependencies, including build dependencies. `static/engine/frozenight/DEPENDENCY-NOTICES.txt` retains their full notices. The pinned Rust standard-library notice and referenced licenses are also shipped; that broad upstream notice covers other targets and unused components too. These are separate from the application's existing chess-piece CC BY-SA license. Shipping an engine permissively does not remove any existing asset obligations.

## Rebuild

Install Rust 1.90.0 with `wasm32-unknown-unknown`, Node >=22.12 and Bun >=1.4.3. Run from the repository root:

```sh
rustup toolchain install 1.90.0 --profile minimal --target wasm32-unknown-unknown
bun install --frozen-lockfile
bun run engine:build
cargo +1.90.0 build --manifest-path engine/frozenight/Cargo.toml --locked --release -p upapawn-engine --bin frozenight-reference
node scripts/engine-notices.mjs
bun run check
bun run test
bun run build
bun run test:browser
bun run cap:sync
```

The build script selects Rust 1.90.0, locked dependencies, release LTO, scalar `wasm32-unknown-unknown`, 1 MiB stack and a hard 256 MiB memory maximum. It verifies imports, embeds the source model, calculates SHA-256 hashes, writes a content-addressed WASM asset/manifest and generates the TypeScript trust anchor. No wasm-bindgen, Emscripten, browser SIMD, native CPU feature or shared memory is needed. WebAssembly compilation/instantiation is supervised independently from search.

For a non-default toolchain installation, set `ENGINE_CARGO=/absolute/path/to/cargo` and the corresponding `CARGO_HOME`/`RUSTUP_HOME`. Builds use `engine/frozenight/target`. Rust and JS sources are supplied alongside the shipped binary so changes can be reviewed and rebuilt. Regenerate notices if dependencies or toolchain change. Engine hash changes invalidate result caches.

## Engine changes

The synchronous core runs entirely in one dedicated Worker. Native thread modules are excluded from WASM. Browser monotonic time is an explicit import. Node and deadline limits also apply in quiescence search. Root MultiPV excludes previous candidates at the same position/depth, searches an optional legal root-move restriction, and publishes an iteration only when all requested candidates finish. An interrupted iteration preserves the previous complete set. Restricted root results do not contaminate unrestricted root TT bounds. Each request starts with a cold hash and ordering state for native/WASM determinism.

The bridge normalizes standard UCI castling to cozy-chess's internal representation, preserves history from the supplied root FEN, returns explicit draw/mate outcomes and replays PVs legally. Allocation exhaustion becomes a typed worker failure; that worker is discarded. Recursion and requested search depth are bounded.

## Local API v1

`src/lib/engine/client.ts` exposes `EngineClient` and `types.ts` defines the versioned contract. Import the client from application code:

```ts
const engine = new EngineClient();
await engine.initialize({ apiVersion: 1, hashMiB: 32 });
const remove = engine.onEvent((event) => {
	/* progress or one terminal */
});
const result = await engine.analyzePosition({
	apiVersion: 1,
	jobId: 'example-1',
	positionId: 'initial',
	position: { rootFen: startingFen, movesUci: [] },
	limits: { maxNodes: 100000, maxTimeMs: 1500 },
	multiPv: 3
});
engine.cancel('example-1'); // stopped / already-finished / unknown; idempotent
engine.reset(); // ends work, clears worker/hash and recent job IDs
remove();
engine.dispose(); // ends work, removes listeners and module references
```

`initialize` optionally validates API/build/network hashes and accepts integer hash memory 16–64 MiB. Requests require unique job IDs within the caller's active session, a legal full root/history, MultiPV 1–3 and at least a node limit (1,000–10,000,000); optional time 10–30,000 ms and depth 1–40. PGN imports are bounded to 1 MiB and 2,000 mainline plies. Side variations/comments/clocks/NAGs do not become mainline moves. The root FEN cannot reconstruct moves before that FEN: callers must provide the available history rather than imply earlier repetition knowledge.

Every accepted search emits exactly one `completed`, `cancelled` or `failed` event; rejected invalid requests do not become jobs. Progress is at most 10 Hz and contains only completed iterations. Job/position IDs and all build/network/settings metadata are attached to each event. `completed` is a lifecycle event: inspect `result.completion` and `reason` to distinguish reaching a requested depth/terminal outcome from hitting time/nodes. Total nodes include unfinished work; `iterationNodes` identifies the last completed set. Zero completed iterations produce no invented score or move.

Scores always use White's perspective. Finite values are integer centipawns, normalized from Frozenight's raw units by division by five. Mate values are signed **plies**, positive for White winning and negative for Black winning; mate at the current root has distance zero and a separate `winner`. The UI formats mate in moves with ceil(abs(plies)/2). Exact/bound tags remain explicit; only exact compatible completed results enter comparisons. Frozenight's root aspiration search resolves a full exact result before publication. No calibrated WDL/accuracy percentage is invented.

Synchronous WASM cannot process a stop message during search. Cancellation immediately terminates the Worker; generation fencing drops stale messages. The client keeps its verified compiled module for replacement, starts a fresh Worker and includes restart costs in diagnostics. Reset preserves that module and disk caches; dispose drops references. Native WebView/OS processes reclaim terminated worker memory on their own schedule. Hash limits bound WASM memory, not total browser process memory.

## Review, caching and offline behavior

`ReviewController` exposes `reviewGame`, `selectPosition`, `pauseReview`, `resumeReview`, `retry`, and `dispose`. The selected position has priority and requests three lines; a whole-game pass requests one. A played move outside the best line is explicitly searched at the **same root** using the same node/time ceilings, capped to the best result’s completed depth. This compares the same horizon instead of letting a forced root line search unnecessarily deeper. Threshold/large-swing/uncertain cases receive deeper comparisons and prioritized mistakes get three alternatives. Alternatives are saved before the played move and displayed/replayed in contextual SAN. The initial position plus each half-move has an indexed state.

Policy `loss-v2`: mover-perspective loss thresholds 50/100/250 cp, negative measured loss clamped with a noise flag, completed exact results with depth difference <=2 required. Mate transitions remain separate from cp. First-pass labels are preliminary; refined means a second comparison, not proven chess truth. All review UI carries the preliminary-estimates qualification while quality/device gates are open. Budgets are provisional and declared in `review.ts`.

The evaluation bar maps pawn score `p` to White percentage `50 + 46*tanh(p/3)` and handles mates separately. Flipping changes orientation, never score perspective. Missing results create gaps in the chart. No illustrative demo analysis is displayed.

Cache keys include full root/history, API, engine/network/build/settings, exact limits, MultiPV/root restrictions and classification version. An incomplete/time-limited search is never promoted to a stronger budget. IndexedDB retains up to 1,000 results and memory up to 128; corruption is validated on read and replaced. Quota/storage errors leave a usable session with a warning. Asset CacheStorage hits are verified by SHA-256 before compilation; corrupt bytes are evicted and fetched again. A mismatched fresh download fails closed and supports retry.

Production web builds generate a versioned offline shell caching all local assets. After installation, different PGNs can be reviewed after reload without a server. Serve WASM with `application/wasm`, Brotli/gzip and immutable headers for hashed assets; HTML/service-worker updates must revalidate. `bun run preview` is a static-only production server implementing these headers. No game data is sent to it. A secure web context is required; localhost is suitable for development.

Capacitor packages the same assets in its application; it does not register the web service worker. Worker URLs, SHA verification and compiled-module transfers work in the installed iOS WKWebView. Android uses the same compiled assets. Native/document visibility pauses search, including during initialization; foreground resumes unless manually paused. Unavailable features produce typed recoverable errors, with no remote fallback.

## Diagnostics and qualification

`/diagnostics` runs 100 real init/search/cancel/replacement/reset/dispose cycles and displays raw JSON without telemetry. `bun run test:browser` runs Chromium, Firefox and WebKit, including corrupt downloads, quota recovery, hide/show, an 80-ply game, alternatives and offline reload. Playwright WebKit's `setOffline` breaks service-worker requests [upstream issue 42775](https://github.com/microsoft/playwright/issues/42775); its offline test stops an isolated origin and proves it unreachable. Cached responses without a SW flag are recorded separately.

```sh
node --experimental-strip-types scripts/benchmark-engine.ts --nodes 30000
node --experimental-strip-types scripts/benchmark-engine.ts --nodes 100000
node --experimental-strip-types scripts/benchmark-tactics.ts
node --cpu-prof --cpu-prof-dir=artifacts/frozenight --cpu-prof-name=engine.cpuprofile --experimental-strip-types scripts/profile-engine.ts
node scripts/verify-native-assets.mjs --android --ios /path/to/built/App.app
node scripts/summarize-engine-evidence.mjs
```

This desktop diagnostic records JSON/CSV, exact inputs/settings, native 10x/20x references, stability, scores/PVs, nodes and memory. Reference stability requires the same move/kind and <=10 cp drift (identical mate distance for mates). All inconclusive cases remain in the report. The original generated corpus tests port fidelity. A separate frozen [Lichess CC0 puzzle corpus](https://database.lichess.org/#puzzles) contains 100 development and 100 held-out non-mate-in-one positions with published full solutions. Its convenience sampling is recorded and results are never filtered based on engine performance. The tactical harness checks every solver turn and accepts an immediate equivalent checkmate. These reference data do not bundle or depend on the Stockfish executable. See `artifacts/frozenight/verification.md` for measurements and open release gates. Physical-phone, stable deeper-reference quality and sustained-run gates must be completed before release qualification.
