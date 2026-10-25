import { DEMO_PGN, parseGame, type SavedGame } from './chess';

const starter: SavedGame = { id: 'opera', pgn: DEMO_PGN, addedAt: '1858-11-02' };
export const app = $state({
	games: [starter] as SavedGame[],
	currentId: 'opera',
	importOpen: false,
	helpOpen: false,
	menuOpen: false,
	analysisOpen: false,
	coordinates: true,
	showEvaluation: true,
	theme: 'light',
	notice: '',
	hydrated: false
});
let noticeTimer: ReturnType<typeof setTimeout>;

export function notify(message: string) {
	clearTimeout(noticeTimer);
	app.notice = message;
	noticeTimer = setTimeout(() => {
		app.notice = '';
	}, 3500);
}

export function hydrate() {
	try {
		const saved = JSON.parse(localStorage.getItem('paper-ink-games') ?? '[]');
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
			app.games = [starter, ...valid.filter((item) => item.id !== 'opera')];
		}
		const settings = JSON.parse(localStorage.getItem('paper-ink-settings') ?? '{}');
		app.coordinates = settings.coordinates !== false;
		app.showEvaluation = settings.showEvaluation !== false;
		app.theme = settings.theme === 'dark' ? 'dark' : 'light';
	} catch {
		notify('Local storage is unavailable. You can still review this session.');
	}
	app.hydrated = true;
}

export function persistSettings() {
	document.documentElement.dataset.theme = app.theme;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute('content', app.theme === 'dark' ? '#1e211d' : '#f5f3ed');
	if (!app.hydrated) return;
	try {
		localStorage.setItem(
			'paper-ink-settings',
			JSON.stringify({
				coordinates: app.coordinates,
				showEvaluation: app.showEvaluation,
				theme: app.theme
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
		app.currentId = existing.id;
		return parsed;
	}
	const game = { id: crypto.randomUUID(), pgn, addedAt: new Date().toISOString() };
	app.games = [...app.games, game];
	app.currentId = game.id;
	try {
		localStorage.setItem(
			'paper-ink-games',
			JSON.stringify(app.games.filter((item) => item.id !== 'opera'))
		);
	} catch {
		notify('Game opened. Device storage is full, so it was not saved.');
	}
	return parsed;
}
