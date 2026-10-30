# Third-party assets

The chess piece SVGs in `static/pieces/` are the **Cburnett** chess piece set by Colin M. L. Burnett, obtained from [lichess-org/lila](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett). The set is licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). These assets are unmodified and remain available under that license.

DM Sans and DM Serif Display are distributed through Fontsource under the SIL Open Font License. Font licenses are included with their respective packages in `node_modules/@fontsource-variable/dm-sans` and `node_modules/@fontsource/dm-serif-display`.

The Opera Game moves are historical game notation. Review scores, classifications, and the evaluation graph are now generated locally by Frozenight. They are preliminary analysis estimates, not historical ratings.

## Frozenight engine and model

Frozenight by Mark Carlson is provided by the pinned npm dependency `chess-engine-kit@0.1.0`. The package records the upstream source revision, model hash, engine build and adapter identity in its manifest. Frozenight and its repository-bundled model use MIT OR Apache-2.0; the package elects MIT.

The package includes the original `LICENSE-MIT.txt` and `LICENSE-APACHE.txt`, consolidated `THIRD-PARTY-NOTICES.txt`, and engine build metadata. Vite emits the assets referenced by `chess-engine-kit/frozenight` into the application bundle. The consolidated notices cover the bundled chess.js, Cargo and Rust standard-library components.

Engine licensing records and notice regeneration are maintained in [chess-engine-kit](https://github.com/sximn/chess-engine-kit). This app does not vendor or compile engine source. The original deterministic game in `tests/fixtures/review-game.json` is app test data and is not shipped at runtime.
