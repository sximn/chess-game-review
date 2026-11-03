# Components

Group components by the part of the app they serve. Use the five folders below; add a new folder when a distinct feature needs one.

| Folder      | Responsibility                                    | Examples                                                                                |
| ----------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ui/`       | Reusable controls and visual containers           | `Button`, `Card`, `Field`, `DialogFrame`, `TabList`                                     |
| `app/`      | Shell, navigation, branding, help, and notices    | `AppShell`, `AppNavigation`, `AppLogo`, `PageHeading`, `HelpDialog`, `NoticeToast`      |
| `replay/`   | Review workspace, chessboard, and game playback   | `GameReview`, `GameReplay`, `Board`, `PlayerRow`, `MoveControls`, `GameActions`         |
| `analysis/` | Engine review panels, tabs, moves, and evaluation | `AnalysisPanel`, `AnalysisSheet`, `AnalysisTabs`, `AnalysisMoves`, `EvaluationTimeline` |
| `games/`    | Welcome screen, saved-game library, and importing | `GameLibrary`, `WelcomeBoard`, `LibraryGameCard`, `ImportDialog`                        |

## Where new code belongs

- Put reusable controls in `ui/`. Pass data and callbacks through props; keep chess logic and shared app state in feature components or `src/lib/` modules.
- Put feature-specific components in their feature folder, even when they appear on multiple routes or in both desktop and mobile layouts.
- Keep supporting types and context beside the components that own them: `ui/field.context.ts`, `ui/tabs.types.ts`, and `analysis/analysis.types.ts`.
- Keep descriptive component names, such as `analysis/AnalysisPanel.svelte`, so editor tabs and search results remain clear.
- Keep route composition in `src/routes/`, and engine logic in `src/lib/engine/`.

## Imports

Use relative imports within a folder:

```ts
import Board from './Board.svelte';
import type { AnalysisPresentation } from './analysis.types';
```

Use explicit `#lib/components/...` imports from routes or across folders. Include `.js` for TypeScript helpers imported through `#lib`:

```ts
import Button from '#lib/components/ui/Button.svelte';
import AppLogo from '#lib/components/app/AppLogo.svelte';
import GameReplay from '#lib/components/replay/GameReplay.svelte';
import type { TabItem } from '#lib/components/ui/tabs.types.js';
```

Import components directly from their files. A central re-export file is unnecessary for this directory.

## Colors and themes

Define shared colors and light/dark differences in `src/lib/styles/foundation.css`.
Components should consume semantic roles instead of adding their own theme selectors:

- Use `--ink` for primary text, `--text-secondary` for supporting text,
  `--text-placeholder` for placeholders, and `--icon-muted` for secondary icons.
- Use `--text-action` and `--text-accent` for green and purple text. Palette hues
  such as `--sage` and `--violet` are accents, not general text colors.
- Use `--selection-bg/text/border` for purple selections and
  `--active-bg/text/border` for green active controls. Keep the state visible on hover.
- Use the `--success-*`, `--error-*`, and `--notice-*` families for feedback.
- Use `--overlay-bg` and the shared `--shadow-*` roles for floating UI.

Public component properties such as `--button-color` can override these defaults,
but their values should reference semantic tokens. Check text contrast against
the actual surface in both themes, including selected and tinted backgrounds.

Brand artwork, the light/dark preference preview illustrations, chess squares,
piece-side indicators, and move-quality markers deliberately keep their own
palette. Preserve those colors. For move-quality **text**, use
`analysis/quality-colors.ts`; its semantic variants keep the hue readable without
changing classification data or graph marker colors. Add a semantic role when a
new shared state needs one, rather than reusing a similarly colored token with a
different meaning.

## Removing components

Before deleting a component, search the repository for imports, template usage, and dynamic loading. Check whether its children still have other callers. After moving or removing files, run `bun run check`, `bun run build`, and the relevant existing tests.
