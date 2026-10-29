# Third-party assets

The chess piece SVGs in `static/pieces/` are the **Cburnett** chess piece set by Colin M. L. Burnett, obtained from [lichess-org/lila](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett). The set is licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). These assets are unmodified and remain available under that license.

DM Sans and DM Serif Display are distributed through Fontsource under the SIL Open Font License. Font licenses are included with their respective packages in `node_modules/@fontsource-variable/dm-sans` and `node_modules/@fontsource/dm-serif-display`.

The Opera Game moves are historical game notation. Review scores, classifications, and the evaluation graph are now generated locally by Frozenight. They are preliminary analysis estimates, not historical ratings.

## Frozenight engine and model

Frozenight by Mark Carlson is provided by the pinned npm dependency `chess-engine-kit@0.0.1`. The package records the upstream source revision, model hash, engine build and adapter identity in its deployment manifest. Frozenight and its repository-bundled model use MIT OR Apache-2.0; the package elects MIT.

The package's asset-copy CLI deploys the original `LICENSE-MIT.txt` and `LICENSE-APACHE.txt`, consolidated `THIRD-PARTY-NOTICES.txt`, and provenance manifests alongside its worker and WASM under `/engines/frozenight/`. These generated assets are included in the web offline shell and native application bundles. The consolidated notices cover the bundled chess.js, Cargo and Rust standard-library components. Read the engine license and consolidated notices from Preferences in the app.

Engine licensing records and notice regeneration are maintained in [chess-engine-kit](https://github.com/sximn/chess-engine-kit). This app does not vendor or compile engine source. The original deterministic game in `tests/fixtures/review-game.json` is app test data and is not shipped at runtime.
