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

## Radiuses and typography

Use the scales in `src/lib/styles/foundation.css` through component properties
and scoped styles. Select a step by purpose, rather than adding a nearby value:

- Corners: `--radius-xs` (4px) for compact rows/badges, `--radius-sm` (8px) for
  small controls and nested elements, `--radius-md` (12px) for ordinary controls
  and compact review cards, `--radius-lg` (16px) for cards/panels, and
  `--radius-xl` (24px) for dialogs/sheets. Use `--radius-pill` for capsules and
  handles, and `--radius-round` for circles. Sheets keep square bottom corners.
- Families: `--font-body` for the interface, `--font-display` for editorial/serif
  headings, and `--font-mono` for editable chess notation.
- Sizes: `--text-caption` (10px at the default root), `--text-sm/md/lg/xl`
  (12/14/16/18px), `--text-title/heading/page` (24/30/34px), and the fluid
  `--text-display` for welcome/empty-state headings. Sizes use rem so browser
  font preferences carry through. Mobile inputs use `--text-input-mobile` to
  keep a 16px minimum and prevent iOS focus zoom.
- Weights: `--weight-regular/medium/semibold/bold/heavy` (400/500/600/700/800).
  Use `--leading-*` for line height and `--tracking-*` for repeated text spacing.

Keep intentional optical exceptions local and explain them: the wordmark has
its own responsive proportions; board coordinates, evaluation labels, markers,
and its frame retain their spatial sizing; theme preview artwork keeps its tiny
corners; the narrow landscape navigation rail keeps 8px labels. Zero radius and
zero text size for an icon-only control are behaviors, not additional scale steps.
Nested clickable review cards inherit their parent's radius so their selected
background fits the container. Preserve public `--button-*`, `--input-*`,
`--textarea-*`, and `--card-*` overrides, choosing scale tokens as their values.

## Removing components

Before deleting a component, search the repository for imports, template usage, and dynamic loading. Check whether its children still have other callers. After moving or removing files, run `bun run check`, `bun run build`, and the relevant existing tests.
