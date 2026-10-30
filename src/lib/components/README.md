# Components

Group components by the part of the app they serve. Use the five folders below; add a new folder when a distinct feature needs one.

| Folder      | Responsibility                                    | Examples                                                                                |
| ----------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `ui/`       | Reusable controls and visual containers           | `Button`, `Card`, `Field`, `DialogFrame`, `TabList`                                     |
| `app/`      | Shell, navigation, branding, help, and notices    | `AppShell`, `AppNavigation`, `AppLogo`, `PageHeading`, `HelpDialog`, `NoticeToast`      |
| `replay/`   | Chessboard, players, and game playback            | `GameReplay`, `Board`, `PlayerRow`, `MoveControls`, `GameActions`                       |
| `analysis/` | Engine review panels, tabs, moves, and evaluation | `AnalysisPanel`, `AnalysisSheet`, `AnalysisTabs`, `AnalysisMoves`, `EvaluationTimeline` |
| `games/`    | Saved-game library and importing                  | `LibraryGameCard`, `ImportDialog`                                                       |

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

## Removing components

Before deleting a component, search the repository for imports, template usage, and dynamic loading. Check whether its children still have other callers. After moving or removing files, run `bun run check`, `bun run build`, and the relevant existing tests.
