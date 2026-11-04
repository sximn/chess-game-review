import { parseGame, type SavedGame } from './chess';
import type { PieceSet } from './pieces';

export const app = $state({
	games: [] as SavedGame[],
	currentId: '',
	importOpen: false,
	helpOpen: false,
	menuOpen: false,
	analysisOpen: false,
	coordinates: true,
	showEvaluation: true,
	theme: 'light',
	pieceSet: 'classic' as PieceSet,
	notice: '',
	hydrated: false
});

let noticeTimer: ReturnType<typeof setTimeout>;

const reviewPositions = new Map<string, number>();

export function getReviewPosition(gameId: string) {
	return reviewPositions.get(gameId) ?? 0;
}

export function rememberReviewPosition(gameId: string, ply: number) {
	reviewPositions.set(gameId, ply);
}

export function notify(message: string) {
	clearTimeout(noticeTimer);
	app.notice = message;
	noticeTimer = setTimeout(() => {
		app.notice = '';
	}, 3500);
}

export function hydrate() {
	try {
		const saved = JSON.parse(localStorage.getItem('upapawn-games') ?? '[]');
		if (Array.isArray(saved)) {
			const valid = saved.filter((item): item is SavedGame => {
				try {
					return (
						typeof item.id === 'string' && typeof item.addedAt === 'string' && !!parseGame(item.pgn)
					);
				} catch {
					return false;
				}
			});
			// Older versions included a built-in game. Keep only the user's imports.
			app.games = valid.filter((item) => item.id !== 'opera');
		}
		const currentId = localStorage.getItem('upapawn-current-game');
		app.currentId =
			app.games.find((game) => game.id === currentId)?.id ?? app.games.at(-1)?.id ?? '';
		const settings = JSON.parse(localStorage.getItem('upapawn-settings') ?? '{}');
		app.coordinates = settings.coordinates !== false;
		app.showEvaluation = settings.showEvaluation !== false;
		app.theme = settings.theme === 'dark' ? 'dark' : 'light';
		app.pieceSet = settings.pieceSet === 'custom' ? 'custom' : 'classic';
	} catch {
		notify('Local storage is unavailable. You can still review this session.');
	}
	app.hydrated = true;
}

export function persistSettings() {
	document.documentElement.dataset.theme = app.theme;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute(
			'content',
			getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
		);
	if (!app.hydrated) return;
	try {
		localStorage.setItem(
			'upapawn-settings',
			JSON.stringify({
				coordinates: app.coordinates,
				showEvaluation: app.showEvaluation,
				theme: app.theme,
				pieceSet: app.pieceSet
			})
		);
	} catch {
		/* The current session remains usable without storage. */
	}
}

export function addGame(pgn: string) {
	const parsed = parseGame(pgn);
	const existing = app.games.find((game) => game.pgn.trim() === pgn.trim());
	if (existing) {
		selectGame(existing.id);
		return parsed;
	}
	const game = { id: crypto.randomUUID(), pgn, addedAt: new Date().toISOString() };
	app.games = [...app.games, game];
	selectGame(game.id);
	try {
		localStorage.setItem('upapawn-games', JSON.stringify(app.games));
	} catch {
		notify('Game opened. Device storage is full, so it was not saved.');
	}
	return parsed;
}

export function currentReviewGame(requestedId: string | null) {
	return app.games.find((game) => game.id === (requestedId ?? app.currentId));
}

export function selectGame(id: string) {
	app.currentId = id;
	try {
		localStorage.setItem('upapawn-current-game', id);
	} catch {
		/* The selected game remains available for this session. */
	}
}
