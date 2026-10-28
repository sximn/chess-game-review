# Third-party assets

The chess piece SVGs in `static/pieces/` are the **Cburnett** chess piece set by Colin M. L. Burnett, obtained from [lichess-org/lila](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett). The set is licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). These assets are unmodified and remain available under that license.

DM Sans and DM Serif Display are distributed through Fontsource under the SIL Open Font License. Font licenses are included with their respective packages in `node_modules/@fontsource-variable/dm-sans` and `node_modules/@fontsource/dm-serif-display`.

The Opera Game moves are historical game notation. Review scores, classifications, and the evaluation graph are now generated locally by Frozenight. They are preliminary analysis estimates, not historical ratings.

## Frozenight engine and model

Frozenight by Mark Carlson is vendored at commit `f4d5a00725b2cd5f1c32910d57a84c77b66cc670`. Its source and repository-bundled `model.json.zst` use MIT OR Apache-2.0; this distribution elects MIT. The original licenses are retained in `engine/frozenight/` and shipped under `/engine/frozenight/`. The Up a Pawn bridge and modifications use MIT. No code from the CrispChess wrapper is used.

The Cargo dependency manifest is [engine/frozenight/dependencies.json](engine/frozenight/dependencies.json). Full notices for 23 locked dependencies, including build dependencies, ship in [DEPENDENCY-NOTICES.txt](static/engine/frozenight/DEPENDENCY-NOTICES.txt). Rust 1.90.0 standard-library notices and referenced license texts ship alongside them as `RUST-COPYRIGHT.html` and `licenses/`; those upstream notices also cover unused components/other compilation targets.

The exact engine/model/build hashes, toolchain and byte sizes are recorded in [manifest.json](static/engine/frozenight/manifest.json). Regenerate notices with `node scripts/engine-notices.mjs` when the lockfile or toolchain changes.

The frozen tactical test fixtures in `tests/fixtures/tactical-corpus.json` are a CC0 subset of the [Lichess puzzle database](https://database.lichess.org/#puzzles). Their source, sampling, retrieval date and rights are recorded in that file. They are test data and are not shipped in the runtime app.
