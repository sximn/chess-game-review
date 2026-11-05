<script lang="ts" module>
	import { Chess } from 'chess.js';
	import type { Color, Move, PieceSymbol, Square } from 'chess.js';

	/** Which side(s) the user may move on this board. */
	export type MovableColor = 'w' | 'b' | 'both' | 'none';

	/** A piece as the view sees it. `id` is stable across moves so the DOM node can animate. */
	interface PieceView {
		id: number;
		color: Color;
		type: PieceSymbol;
		square: Square;
	}

	interface DragState {
		pieceId: number;
		from: Square;
		pointerId: number;
		pointerType: string;
		/** Where the pointer went down (client coords) - used for the drag threshold. */
		startX: number;
		startY: number;
		/** Centre of the dragged piece, in px relative to the board's top-left. */
		x: number;
		y: number;
		/** Edge length of one square in px (kept fresh so resizing mid-drag is fine). */
		size: number;
		/** Becomes true once the pointer moved far enough to count as a drag, not a click. */
		active: boolean;
		/** Was this piece already selected when the pointer went down? (click toggles it off) */
		wasSelected: boolean;
	}

	interface PromotionState {
		from: Square;
		to: Square;
		color: Color;
		pieceId: number;
	}

	const FILES = 'abcdefgh';
	const PROMOTION_PIECES: PieceSymbol[] = ['q', 'n', 'r', 'b'];
	const PIECE_NAMES: Record<PieceSymbol, string> = {
		k: 'king',
		q: 'queen',
		r: 'rook',
		b: 'bishop',
		n: 'knight',
		p: 'pawn'
	};

	const EVAL_RAIL_STYLES = {
		TOP: "top: 8px;color:white;",
		BOTTOM: "bottom:8px;color:black;",
	};

	const DRAG_THRESHOLD_MOUSE = 0; //3 px
	const DRAG_THRESHOLD_TOUCH = 0; //8 px - fingers jitter more than mice
	/** On touch, the dragged piece floats this many squares above the fingertip so it stays visible. */
	const TOUCH_LIFT = 0; // 0.6;
	/** If a single update changes more pieces than this, we jump instead of animating. */
	const SNAP_THRESHOLD = 4;
	const FADE_MS = 140;

	let nextPieceId = 0;

	const toSquare = (file: number, rank: number) => `${FILES[file]}${rank + 1}` as Square;
	const fileOf = (sq: string) => sq.charCodeAt(0) - 97;
	const rankOf = (sq: string) => Number(sq[1]) - 1;
	const distance = (a: Square, b: Square) =>
		(fileOf(a) - fileOf(b)) ** 2 + (rankOf(a) - rankOf(b)) ** 2;

	function findKing(chess: Chess, color: Color): Square | null {
		for (const row of chess.board()) {
			for (const cell of row) {
				if (cell?.type === 'k' && cell.color === color) return cell.square;
			}
		}
		return null;
	}

	/**
	 * Diffs the new position against the previous piece list and keeps piece identities stable,
	 * so a piece that moved is the *same* keyed DOM node (which lets CSS animate it).
	 *
	 * - pieces that did not move keep their object
	 * - moved pieces (incl. castling rook, en passant) are matched by type/colour + shortest distance
	 * - promotions are matched via the `lastMove` hint
	 * - the rest are created (appear) / dropped (captured → fade out)
	 *
	 * The returned array keeps the previous order and appends new pieces. Never reorder keyed DOM
	 * nodes - re-inserting a node cancels its running CSS transition.
	 */
	function reconcile(chess: Chess, hint: Move | undefined, prev: PieceView[]) {
		type Wanted = { square: Square; color: Color; type: PieceSymbol };
		const wanted: Wanted[] = [];

		for (const row of chess.board()) {
			for (const cell of row) {
				if (cell) {
					wanted.push(cell);
				}
			}
		}

		const prevBySquare = new Map(prev.map((p) => [p.square, p] as const));
		const next = new Map<number, PieceView>();
		let open: Wanted[] = [];

		// 1. Untouched pieces
		for (const w of wanted) {
			const p = prevBySquare.get(w.square);
			if (p && p.color === w.color && p.type === w.type) {
				next.set(p.id, p);
			} else {
				open.push(w);
			}
		}

		let free = prev.filter((p) => !next.has(p.id));

		// 2. Promotion (pawn becomes another piece, keep identity so it slides to the last rank)
		if (hint?.promotion) {
			const w = open.find(
				(x) => x.square === hint.to && x.type === hint.promotion && x.color === hint.color
			);
			const p = free.find(
				(x) => x.square === hint.from && x.type === 'p' && x.color === hint.color
			);
			if (w && p) {
				next.set(p.id, { ...p, type: w.type, square: w.square });
				open = open.filter((x) => x !== w);
				free = free.filter((x) => x !== p);
			}
		}

		// 3. Moved pieces: closest same-kind piece wins, the hinted move always wins
		const pairs: { w: Wanted; p: PieceView; d: number }[] = [];
		for (const w of open) {
			for (const p of free) {
				if (p.color !== w.color || p.type !== w.type) {
					continue;
				}

				const isHint = !!hint && hint.from === p.square && hint.to === w.square;
				pairs.push({ w, p, d: isHint ? -1 : distance(p.square, w.square) });
			}
		}
		pairs.sort((a, b) => a.d - b.d);
		const matched = new Set<Square>();
		for (const { w, p } of pairs) {
			if (matched.has(w.square) || next.has(p.id)) {
				continue;
			}

			matched.add(w.square);
			next.set(p.id, { ...p, square: w.square });
		}

		// 4. Whatever is left over appears out of nowhere
		const created: PieceView[] = [];
		for (const w of open) {
			// `open` already excludes the promotion target, so anything unmatched here is genuinely new
			if (!matched.has(w.square)) {
				created.push({ id: nextPieceId++, ...w });
			}
		}

		const removed = free.filter((p) => !next.has(p.id)).length;
		let moved = 0;
		for (const p of prev) {
			if (next.has(p.id) && next.get(p.id) !== p) {
				moved++;
			}
		}

		const changes = moved + created.length + removed;
		if (changes === 0) {
			return { pieces: prev, changes: 0 };
		}

		const pieces = [...prev.filter((p) => next.has(p.id)).map((p) => next.get(p.id)!), ...created];
		return { pieces, changes };
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { TransitionConfig } from 'svelte/transition';
	import { app } from '#lib/state.svelte.js';
	import { pieceSrc } from '#lib/pieces.js';
	import type { ClassificationMarkerProps } from '#lib/engine/classification.js';

	let {
		fen,
		flipped = false,
		lastMove,
		suggestedMove,
		evaluation = null,
		markerProps,
		evaluationLabel = '—',
		movable = 'none',
		animationMs = 200,
		onMove
	}: {
		fen: string;
		flipped?: boolean;
		lastMove?: Move;
		suggestedMove?: Move;
		evaluation?: number | null;
		markerProps: ClassificationMarkerProps | null;
		evaluationLabel?: string;
		/** Which side the user may move. 'none' (default) makes the board read-only. */
		movable?: MovableColor;
		/** Duration of the piece slide animation. 0 disables animation. */
		animationMs?: number;
		/**
		 * Called with the fully validated chess.js move when the user plays one. The board is
		 * controlled: it never changes its own position - update `fen` (e.g. `move.after`) and
		 * `lastMove` in response.
		 */
		onMove?: (move: Move) => void;
	} = $props();

	const boardId = $props.id();

	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let boardEl = $state<HTMLDivElement>();

	let position = $derived(new Chess(fen));
	let interactive = $derived(movable !== 'none');
	let motionMs = $derived(reducedMotion ? 0 : animationMs);

	// ==========> state

	let pieces = $state.raw<PieceView[]>([]);
	/** True for a moment after a big jump / flip so pieces teleport instead of sliding. */
	let snap = $state(false);

	let selected = $state<Square | null>(null);
	let drag = $state<DragState | null>(null);
	let promotion = $state<PromotionState | null>(null);
	let hoverSq = $state<Square | null>(null);
	let kbSquare = $state<Square | null>(null);
	let usingKeyboard = $state(false);

	// ==========> orientation-aware coordinates

	const colOf = (sq: Square) => (flipped ? 7 - fileOf(sq) : fileOf(sq));
	const rowOf = (sq: Square) => (flipped ? rankOf(sq) : 7 - rankOf(sq));
	const squareAt = (col: number, row: number) =>
		toSquare(flipped ? 7 - col : col, flipped ? row : 7 - row);

	// const suggestionPath = $derived.by(() => {
	// 	if (!suggestedMove) {
	// 		return '';
	// 	}

	// 	const x1 = colOf(suggestedMove.from) + 0.5;
	// 	const y1 = rowOf(suggestedMove.from) + 0.5;
	// 	const x2 = colOf(suggestedMove.to) + 0.5;
	// 	const y2 = rowOf(suggestedMove.to) + 0.5;

	// 	const elbow =
	// 		suggestedMove.piece === 'n'
	// 			? Math.abs(x2 - x1) === 2
	// 				? ` L ${x2} ${y1}`
	// 				: ` L ${x1} ${y2}`
	// 			: '';
	// 	return `M ${x1} ${y1}${elbow} L ${x2} ${y2}`;
	// });
	const suggestionPath = $derived.by(() => {
		if (!suggestedMove) {
			return '';
		}

		const x1 = colOf(suggestedMove.from) + 0.5;
		const y1 = rowOf(suggestedMove.from) + 0.5;
		const x2 = colOf(suggestedMove.to) + 0.5;
		const y2 = rowOf(suggestedMove.to) + 0.5;

		const dx = x2 - x1;
		const dy = y2 - y1;

		if (dx === 0 && dy === 0) {
			return '';
		}

		const isKnight = suggestedMove.piece === 'n';
		const horizontalFirst = Math.abs(dx) === 2;
		const elbowX = horizontalFirst ? x2 : x1;
		const elbowY = horizontalFirst ? y1 : y2;

		const firstDx = isKnight ? elbowX - x1 : dx;
		const firstDy = isKnight ? elbowY - y1 : dy;
		const lastDx = isKnight ? x2 - elbowX : dx;
		const lastDy = isKnight ? y2 - elbowY : dy;

		const tailOffset = 0.17;
		const endInset = 0.20;

		const tailScale = tailOffset / Math.hypot(firstDx, firstDy);
		const endScale = (0.5 - endInset) / Math.max(Math.abs(lastDx), Math.abs(lastDy));

		const startX = x1 + firstDx * tailScale;
		const startY = y1 + firstDy * tailScale;
		const endX = x2 - lastDx * endScale;
		const endY = y2 - lastDy * endScale;

		const elbow = isKnight ? ` L ${elbowX} ${elbowY}` : '';
		return `M ${startX} ${startY}${elbow} L ${endX} ${endY}`;
	});

	// ==========> piece identity / animation sync

	let tracked: PieceView[] = [];
	let initialised = false;
	let prevFlipped: boolean | undefined;
	let snapFrame = 0;

	function triggerSnap() {
		snap = true;
		cancelAnimationFrame(snapFrame);
		// two frames: the first lets the DOM update with transitions disabled, the second re-enables them
		snapFrame = requestAnimationFrame(() => {
			snapFrame = requestAnimationFrame(() => (snap = false));
		});
	}

	$effect.pre(() => {
		const result = reconcile(position, lastMove, tracked);
		const flipChanged = prevFlipped !== undefined && prevFlipped !== flipped;

		if (initialised && (flipChanged || result.changes > SNAP_THRESHOLD)) {
			triggerSnap();
		}

		prevFlipped = flipped;
		initialised = true;
		tracked = result.pieces;
		pieces = result.pieces;
	});

	$effect(() => () => cancelAnimationFrame(snapFrame));

	// A new position (or a change in who may move) invalidates whatever the user was doing.
	$effect.pre(() => {
		void position;
		void movable;
		untrack(() => {
			selected = null;
			drag = null;
			promotion = null;
		});
	});

	// ===========> derived view data

	let squares = $derived.by(() => {
		const list: { square: Square; col: number; row: number; dark: boolean }[] = [];
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const square = squareAt(col, row);
				list.push({ square, col, row, dark: (fileOf(square) + rankOf(square)) % 2 === 0 });
			}
		}
		return list;
	});

	let checkSquare = $derived(position.isCheck() ? findKing(position, position.turn()) : null);

	let selectedMoves = $derived<Move[]>(
		selected && interactive ? position.moves({ square: selected, verbose: true }) : []
	);

	/** destination square → legal moves ending there (several when promoting) */
	let targets = $derived.by(() => {
		const map = new Map<Square, Move[]>();
		for (const move of selectedMoves) {
			const list = map.get(move.to);
			if (list) list.push(move);
			else map.set(move.to, [move]);
		}
		return map;
	});

	let hoverTarget = $derived(drag?.active && hoverSq && targets.has(hoverSq) ? hoverSq : null);

	let cursor = $derived.by(() => {
		if (!interactive) {
			return undefined;
		}

		if (drag?.active) {
			return 'grabbing';
		}

		if (hoverSq) {
			if (targets.has(hoverSq)) {
				return 'pointer';
			}

			const piece = position.get(hoverSq);
			if (piece && canMove(piece.color)) {
				return 'grab';
			}
		}
		return undefined;
	});

	const pieceLabel = (p: { color: Color; type: PieceSymbol }) =>
		`${p.color === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[p.type]}`;

	let announcement = $derived.by(() => {
		if (!interactive) {
			return '';
		}

		if (promotion) {
			return 'Choose a piece to promote to.';
		}

		if (selected) {
			const p = position.get(selected);
			const n = selectedMoves.length;
			return `${p ? pieceLabel(p) : 'Piece'} on ${selected} selected, ${n} legal ${n === 1 ? 'move' : 'moves'}.`;
		}
		if (usingKeyboard && kbSquare) {
			const p = position.get(kbSquare);
			return `${kbSquare}, ${p ? pieceLabel(p) : 'empty'}`;
		}
		return '';
	});

	// ========> helpers

	function canMove(color: Color) {
		return (movable === 'both' || movable === color) && color === position.turn();
	}

	function isDragging(piece: PieceView) {
		return drag?.active === true && drag.pieceId === piece.id;
	}

	function pieceTransform(piece: PieceView): string {
		if (drag?.active && drag.pieceId === piece.id) {
			const half = drag.size / 2;
			// console.log({drag: $state.snapshot(drag)}, `translate(${drag.x - half}px, ${drag.y - half}px)`);
			// return `translate(${drag.x - half}px, ${drag.y - half}px)`;
			return `translate(${drag.x - half}px, ${drag.y - half}px)`;
		}
		// while the promotion picker is open, show the pawn already on its destination
		const square = promotion?.pieceId === piece.id ? promotion.to : piece.square;
		return `translate(${colOf(square) * 100}%, ${rowOf(square) * 100}%)`;
	}

	function fadeDuration() {
		return snap || motionMs === 0 ? 0 : FADE_MS;
	}

	/** Captured pieces fade out *underneath* the piece that takes them. */
	function captureOut(_node: Element): TransitionConfig {
		return { duration: fadeDuration(), css: (t) => `opacity: ${t}; z-index: 0;` };
	}

	function squareAtLocal(x: number, y: number, size: number): Square | null {
		if (x < 0 || y < 0 || x >= size * 8 || y >= size * 8) return null;
		return squareAt(Math.floor(x / size), Math.floor(y / size));
	}

	/** Pointer position relative to the board (without any touch lift). */
	function pointerLocal(e: PointerEvent) {
		const rect = boardEl!.getBoundingClientRect();
		const size = rect.width / 8;
		return { x: e.clientX - rect.left, y: e.clientY - rect.top, size };
	}

	/** Where the dragged piece's centre is for this event (touch lifts it above the finger). */
	function dragLocal(e: PointerEvent) {
		const p = pointerLocal(e);
		const lift = e.pointerType === 'touch' ? p.size * TOUCH_LIFT : 0;
		return { ...p, y: p.y - lift };
	}

	function defaultCursorSquare(): Square {
		return selected ?? findKing(position, position.turn()) ?? 'e4';
	}

	// =========> actions

	function cancelAll() {
		selected = null;
		drag = null;
		promotion = null;
	}

	function commit(move: Move) {
		selected = null;
		drag = null;
		promotion = null;
		onMove?.(move);
		if (usingKeyboard) boardEl?.focus({ preventScroll: true });
	}

	/** Plays from→to, or opens the promotion picker if the move needs one. */
	function attemptMove(from: Square, to: Square) {
		const candidates = position.moves({ square: from, verbose: true }).filter((m) => m.to === to);
		if (candidates.length === 0) {
			selected = null;
			return;
		}
		if (candidates.some((m) => m.promotion)) {
			const view = pieces.find((p) => p.square === from);
			if (!view) return;
			promotion = { from, to, color: candidates[0].color, pieceId: view.id };
			return;
		}
		commit(candidates[0]);
	}

	function choosePromotion(type: PieceSymbol) {
		if (!promotion) {
			return;
		}

		const move = position
			.moves({ square: promotion.from, verbose: true })
			.find((m) => m.to === promotion!.to && m.promotion === type);

		if (move) {
			commit(move);
		} else {
			cancelAll();
		}
	}

	function cancelPromotion() {
		cancelAll();
		if (usingKeyboard) {
			boardEl?.focus({ preventScroll: true });
		}
	}

	/** Shared by keyboard activation: select / deselect / move, like a click would. */
	function activate(sq: Square) {
		if (selected && targets.has(sq)) {
			attemptMove(selected, sq);
			return;
		}
		const piece = position.get(sq);
		if (piece && canMove(piece.color)) {
			selected = selected === sq ? null : sq;
			return;
		}
		selected = null;
	}

	// ==========> pointer input

	function onpointerdown(e: PointerEvent) {
		usingKeyboard = false;
		if (!interactive || promotion || drag || !boardEl) {
			return;
		}

		if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) {
			return;
		}

		const { x, y, size } = pointerLocal(e);
		const sq = squareAtLocal(x, y, size);
		if (!sq) {
			return;
		}

		// Click-to-move: a piece is selected and the user pressed one of its destinations
		if (selected && targets.has(sq)) {
			e.preventDefault();
			attemptMove(selected, sq);
			return;
		}

		// Pressed one of the user's own pieces → select it and arm a possible drag
		const piece = position.get(sq);
		const view = pieces.find((p) => p.square === sq);
		if (piece && view && canMove(piece.color)) {
			e.preventDefault();
			const wasSelected = selected === sq;
			selected = sq;
			kbSquare = sq;
			drag = {
				pieceId: view.id,
				from: sq,
				pointerId: e.pointerId,
				pointerType: e.pointerType,
				startX: e.clientX,
				startY: e.clientY,
				x,
				y,
				size,
				active: false,
				wasSelected
			};
			try {
				boardEl.setPointerCapture(e.pointerId);
			} catch {
				// pointer already gone - nothing to capture
			}
			return;
		}

		// Anything else (empty square, enemy piece that isn't capturable, …) → click away
		selected = null;
	}

	function onpointermove(e: PointerEvent) {
		if (!boardEl) {
			return;
		}

		if (drag && e.pointerId === drag.pointerId) {
			if (!drag.active) {
				const threshold = e.pointerType === 'mouse' ? DRAG_THRESHOLD_MOUSE : DRAG_THRESHOLD_TOUCH;
				if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < threshold) return;
				drag.active = true;
			}
			const { x, y, size } = dragLocal(e);
			drag.x = x;
			drag.y = y;
			drag.size = size;
			hoverSq = squareAtLocal(x, y, size);
			return;
		}

		if (e.pointerType === 'mouse' && interactive) {
			const { x, y, size } = pointerLocal(e);
			hoverSq = squareAtLocal(x, y, size);
		}
	}

	function onpointerup(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointerId || !boardEl) {
			return;
		}

		const d = drag;
		drag = null; // from here the piece animates from the pointer to wherever it belongs
		try {
			boardEl.releasePointerCapture(e.pointerId);
		} catch {
			// already released
		}

		// Plain click on a piece: it was already selected on pointerdown; a second click unselects it
		if (!d.active) {
			if (d.wasSelected) selected = null;
			return;
		}

		const { x, y, size } = dragLocal(e);
		const to = squareAtLocal(x, y, size);
		hoverSq = e.pointerType === 'mouse' ? pointerSquare(e) : null;

		if (!to) {
			// dropped outside the board → cancel, piece glides back
			selected = null;
			return;
		}

		if (to === d.from) {
			return; // put back where it was: keep the selection and its hints
		}

		if (targets.has(to)) {
			attemptMove(d.from, to);
			return;
		}
		selected = null; // illegal drop → cancel, piece glides back
	}

	function pointerSquare(e: PointerEvent): Square | null {
		const { x, y, size } = pointerLocal(e);
		return squareAtLocal(x, y, size);
	}

	function onpointercancel() {
		if (drag) {
			cancelAll();
		}
	}

	function onlostpointercapture() {
		if (drag) {
			cancelAll();
		}
	}

	function onpointerleave() {
		if (!drag) {
			hoverSq = null;
		}
	}

	function oncontextmenu(e: Event) {
		// long-press on touch devices would otherwise open a context menu mid-drag
		if (interactive && (drag || (e as PointerEvent).pointerType === 'touch')) {
			e.preventDefault();
		}
	}

	// Clicking/tapping anywhere outside the board drops the selection
	function onwindowpointerdown(e: PointerEvent) {
		if (!selected && !promotion) {
			return;
		}

		if (boardEl && e.target instanceof Node && boardEl.contains(e.target)) {
			return;
		}

		cancelAll();
	}

	function onwindowkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && (selected || drag || promotion)) {
			e.preventDefault();
			cancelAll();

			if (usingKeyboard) {
				boardEl?.focus({ preventScroll: true });
			}
		}
	}

	// ==> keyboard input

	function onfocus() {
		kbSquare ??= defaultCursorSquare();
	}

	function onkeydown(e: KeyboardEvent) {
		if (!interactive || promotion || e.altKey || e.ctrlKey || e.metaKey) {
			return;
		}

		usingKeyboard = true;

		const current = kbSquare ?? defaultCursorSquare();
		let col = colOf(current);
		let row = rowOf(current);

		switch (e.key) {
			case 'ArrowLeft':
				col--;
				break;
			case 'ArrowRight':
				col++;
				break;
			case 'ArrowUp':
				row--;
				break;
			case 'ArrowDown':
				row++;
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				kbSquare = current;
				activate(current);
				return;
			default:
				return;
		}
		e.preventDefault();
		kbSquare = squareAt(Math.min(7, Math.max(0, col)), Math.min(7, Math.max(0, row)));
	}

	/**
	 * Adjust height for readability.
	 * Preserve tiny hieght on massive advantage but zero height on mate in X.
	 */
	function adjustEvalHeight(evaluation: number | null) {
		if (evaluation === null) {
			return 50;
		}

		// for mate in X, the eval is infinity or negative infinity
		if (!Number.isFinite(evaluation)) {
			return evaluation < 0 ? 0 : 100;
		}

		return 50 + 48 * Math.tanh(evaluation / 3);
	}

	// Keyboard users: move focus into the promotion picker when it opens
	$effect(() => {
		if (promotion && usingKeyboard) {
			boardEl?.querySelector<HTMLButtonElement>('.promotion-choice')?.focus();
		}
	});
</script>

<svelte:window
	onpointerdown={onwindowpointerdown}
	onkeydown={onwindowkeydown}
	onblur={onpointercancel}
/>

<div class="board-with-eval">
	{#if app.showEvaluation}
		<div
			class="evaluation-rail"
			class:flipped
			aria-label={evaluation === null
				? 'Evaluation unavailable'
				: `White perspective: ${evaluationLabel}`}
		>
			<div
				class="eval-white"
				style:height={`${adjustEvalHeight(evaluation)}%`}
			></div>
			<span
				style={evaluation && evaluation > 0 ? EVAL_RAIL_STYLES.BOTTOM : EVAL_RAIL_STYLES.TOP}
			>
				{evaluation === null ? '-' : evaluationLabel}
			</span>
		</div>
	{/if}

	{#if interactive}
		<div
			bind:this={boardEl}
			class="chessboard interactive"
			class:dragging={drag?.active}
			role="grid"
			aria-activedescendant={`${boardId}-${kbSquare}`}
			aria-roledescription="chessboard"
			tabindex="0"
			aria-label={`Chess position. ${position.turn() === 'w' ? 'White' : 'Black'} to move${position.isCheckmate() ? ', checkmate' : position.isCheck() ? ', check' : ''}.`}
			style:cursor
			style:--move-ms={`${motionMs}ms`}
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			{onpointercancel}
			{onlostpointercapture}
			{onpointerleave}
			{oncontextmenu}
			{onkeydown}
			{onfocus}
		>
			{@render boardContent()}
		</div>
	{:else}
		<div
			bind:this={boardEl}
			class="chessboard"
			role="img"
			aria-label={`Chess position. ${position.turn() === 'w' ? 'White' : 'Black'} to move${position.isCheckmate() ? ', checkmate' : position.isCheck() ? ', check' : ''}.`}
			style:--move-ms={`${motionMs}ms`}
		>
			{@render boardContent()}
		</div>
	{/if}

	<div class="sr-only" aria-live="polite">{announcement}</div>
</div>

{#snippet boardContent()}
	{#each [0, 1, 2, 3, 4, 5, 6, 7] as row}
		<div role="row" class="board-row">
			{#each squares.filter((s) => s.row === row) as s (s.square)}
				{@const target = promotion ? undefined : targets.get(s.square)}
				{@const ghost = drag?.active && drag.from === s.square ? position.get(s.square) : undefined}
				{@const piece = position.get(s.square)}

				<div
					id={`${boardId}-${s.square}`}
					role="gridcell"
					tabindex="-1"
					aria-label={`${s.square}: ${
						piece
							? `${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[piece.type]}`
							: 'empty'
					}`}
					aria-selected={s.square === selected}
					class="square"
					class:dark={s.dark}
					class:last-move={s.square === lastMove?.from || s.square === lastMove?.to}
					class:king-check={s.square === checkSquare}
					class:selected={s.square === selected}
					class:target={!!target}
					class:capture={!!target &&
						target.some((m) => m.flags.includes('c') || m.flags.includes('e'))}
					class:drag-over={s.square === hoverTarget}
					class:kb-cursor={usingKeyboard && s.square === kbSquare}
				>
					{#if app.coordinates && s.col === 0}
						<span class="rank-label">{s.square[1]}</span>
					{/if}

					{#if app.coordinates && s.row === 7}
						<span class="file-label">{s.square[0]}</span>
					{/if}

					{#if ghost}
						<img
							class="ghost"
							src={pieceSrc(app.pieceSet, ghost.color, ghost.type)}
							alt=""
							draggable="false"
						/>
					{/if}

					{#if markerProps && s.square === lastMove?.to}
						<span
							class="board-marker"
							style={`background:${markerProps.background}`}
						>
							{markerProps.marker}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/each}

	<div class="pieces" class:snap>
		{#each pieces as piece (piece.id)}
			{@const lifting = isDragging(piece)}
			<div
				class="piece"
				class:dragging={lifting}
				class:lifted={lifting && drag?.pointerType === 'touch'}
				style:transform={pieceTransform(piece)}
				in:fade={{ duration: fadeDuration() }}
				out:captureOut
			>
				<img
					src={pieceSrc(app.pieceSet, piece.color, piece.type)}
					alt={`${pieceLabel(piece)} on ${piece.square}`}
					draggable="false"
				/>
			</div>
		{/each}
	</div>

	{#if suggestedMove}
		<svg
			class="suggestion-arrow"
			class:black={suggestedMove.color === "b"}
			data-from={suggestedMove.from}
			data-to={suggestedMove.to}
			viewBox="0 0 8 8"
			role="img"
			aria-label={`Best move: ${suggestedMove.san}, ${suggestedMove.from} to ${suggestedMove.to}`}
		>
			<defs>
				<marker
					id={`${boardId}-arrowhead`}
					viewBox="0 0 10 10"
					refX="6"
					refY="5"
					markerWidth="0.44"
					markerHeight="0.44"
					markerUnits="userSpaceOnUse"
					orient="auto"
				>
					<path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" stroke="currentColor" stroke-width="0.6" stroke-linejoin="round" />
				</marker>

				<filter
					id={`${boardId}-arrow-shadow`}
					filterUnits="userSpaceOnUse"
					x="0" y="0" width="8" height="8"
				>
					<feDropShadow dx="0" dy="0.02" stdDeviation="0.035" flood-color="#000" flood-opacity="0.35" />
				</filter>
			</defs>

			<g opacity="0.82" filter={`url(#${boardId}-arrow-shadow)`}>
				<path
					class="suggestion-path"
					d={suggestionPath}
					fill="none"
					stroke="currentColor"
					stroke-width="0.15"
					stroke-linecap="butt"
					stroke-linejoin="round"
					marker-end={`url(#${boardId}-arrowhead)`}
				/>
			</g>
		</svg>
	{/if}

	{#if promotion}
		{@const promo = promotion}
		{@const atTop = rowOf(promo.to) === 0}

		<div class="promotion-backdrop">
			<button
				type="button"
				class="promotion-dismiss"
				aria-label="Cancel promotion"
				onclick={cancelPromotion}
			></button>

			<div
				class="promotion-choices"
				class:from-bottom={!atTop}
				style:left={`${colOf(promo.to) * 12.5}%`}
				role="group"
				aria-label="Choose promotion piece"
			>
				{#each PROMOTION_PIECES as type (type)}
					<button
						type="button"
						class="promotion-choice"
						aria-label={`Promote to ${PIECE_NAMES[type]}`}
						onclick={() => choosePromotion(type)}
					>
						<img src={pieceSrc(app.pieceSet, promo.color, type)} alt="" draggable="false" />
					</button>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<style>
	.suggestion-arrow {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 6;
		pointer-events: none;
		color: var(--suggestion-arrow-white, #2f9e6f);
		overflow: visible;
	}
	.suggestion-arrow.black {
		color: var(--suggestion-arrow-black, #9e722f);
	}
	.board-with-eval {
		display: flex;
		align-items: stretch;
		width: 100%;
		position: relative;
	}
	.evaluation-rail {
		width: 14px;
		flex-shrink: 0;
		background: #2e2e2e;
		position: relative;
		overflow: hidden;
		border: 1px solid #626c502a;
	}
	.eval-white {
		background: #f6f4eb;
		position: absolute;
		bottom: 0;
		width: 100%;
		transition: height 0.35s;
	}
	.evaluation-rail > span {
		position: absolute;
		left: 0;
		right: 0;
		text-align: center;
		color: #4b5540;
		font-size: 6px;
		font-weight: 800;
		display: block;
		margin: auto;
	}
	.evaluation-rail.flipped {
		transform: rotate(180deg);
	}
	.evaluation-rail.flipped > span {
		transform: rotate(180deg);
	}

	@media (min-width: 760px) {
		.board-with-eval {
			gap: 4px;
		}
		.evaluation-rail {
			width: 20px;
		}
		.evaluation-rail > span {
			font-size: 10px;
		}
	}

	/* board */
	.chessboard {
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		grid-template-rows: repeat(8, 1fr);
		border-radius: 5px;
		box-shadow:
			0 0 0 1px #6d79552b,
			0 3px 5px #3c46200e;
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		-webkit-tap-highlight-color: transparent;
		min-width: 0;
		flex: 1;
		position: relative;
		isolation: isolate;
		outline: none;
	}
	.chessboard.interactive {
		/* we handle all gestures ourselves - stops the page scrolling/zooming under a dragging finger */
		touch-action: none;
	}
	.chessboard.interactive:focus-visible {
		outline: 2px solid var(--violet);
		outline-offset: 2px;
	}
	.board-row {
		display: contents;
	}

	/* squares */
	.square {
		position: relative;
		background: var(--board-light);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		min-width: 0;
	}
	.square.dark {
		background: var(--board-dark);
	}
	.square.last-move {
		background: #d8d58b;
	}
	.square.dark.last-move {
		background: #b8bf70;
	}
	.square.king-check {
		background:
			radial-gradient(ellipse, #db6357 0%, #d8776266 45%, transparent 80%), var(--board-light);
	}
	.square.dark.king-check {
		background:
			radial-gradient(ellipse, #db6357 0%, #d8776266 45%, transparent 80%), var(--board-dark);
	}
	.square.selected {
		background: #c9d874;
	}
	.square.dark.selected {
		background: #a3b94f;
	}

	/* legal-move hints: a dot on empty squares, a ring on captures */
	.square.target::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		width: 30%;
		height: 30%;
		border-radius: 50%;
		background: #1f3a1054;
		pointer-events: none;
	}
	.square.target.capture::after {
		width: 100%;
		height: 100%;
		border-radius: 0;
		background: radial-gradient(circle closest-side, transparent 0, transparent 84%, #1f3a1054 86%);
	}
	/* square under the dragged piece */
	.square.drag-over {
		box-shadow: inset 0 0 0 3px #ffffffb8;
	}
	.chessboard:focus-visible .square.kb-cursor {
		outline: 3px solid var(--violet);
		outline-offset: -3px;
	}

	/* the faded copy left behind while dragging */
	.ghost {
		width: 85%;
		height: 85%;
		object-fit: contain;
		opacity: 0.28;
		pointer-events: none;
	}

	.rank-label,
	.file-label {
		font-size: 8px;
		color: #71845b;
		font-weight: 650;
		position: absolute;
		z-index: 2;
		line-height: 1;
		pointer-events: none;
	}
	.square.dark .rank-label,
	.square.dark .file-label {
		color: #e7ebd1;
	}
	.rank-label {
		left: 4px;
		top: 4px;
	}
	.file-label {
		right: 4px;
		bottom: 4px;
	}
	.board-marker {
		position: absolute;
		right: 0;
		top: 0;
		z-index: 3;
		border-radius: 50%;
		border: 1.5px solid #f9fae9;
		color: #fff;
		display: grid;
		place-items: center;
		font-size: 14px;
		font-weight: 800;
		line-height: 1;
		width: 24px;
		height: 24px;
		box-shadow: 0 2px 4px #0002;
		pointer-events: none;
		/* pops in once the piece has (almost) arrived */
		animation: marker-in 90ms ease-out calc(var(--move-ms, 0ms) * 0.8) both;
	}
	@keyframes marker-in {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* pieces */
	.pieces {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none; /* all input is handled by the board element */
	}
	.piece {
		position: absolute;
		left: 0;
		top: 0;
		width: 12.5%;
		height: 12.5%;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
		will-change: transform;
		transition:
			transform var(--move-ms, 200ms) cubic-bezier(0.3, 0.75, 0.3, 1),
			scale 120ms ease-out;
	}
	.piece img {
		width: 85%;
		height: 85%;
		object-fit: contain;
		filter: drop-shadow(0 2px 1px #262e1b22);
		pointer-events: none;
		-webkit-user-drag: none;
		transition: filter 120ms;
	}
	/* while held, the piece follows the pointer 1:1 - no transform transition, only the "lift" */
	.piece.dragging {
		z-index: 10;
		transition: transform 40ms ease-out;
	}
	.piece.dragging img {
		filter: drop-shadow(0 5px 4px #262e1b44);
	}
	.piece.dragging.lifted {
		scale: 2; /* 1,3 */
	}
	.pieces.snap .piece {
		transition: none;
	}
	.chessboard.dragging {
		cursor: grabbing;
	}

	/* promotion picker */
	.promotion-backdrop {
		position: absolute;
		inset: 0;
		z-index: 10;
		background: #1b2214a6;
		cursor: pointer;
	}
	.promotion-choices {
		position: absolute;
		top: 0;
		width: 12.5%;
		height: 50%;
		display: flex;
		flex-direction: column;
		border-radius: 4px;
		overflow: hidden;
		box-shadow: 0 6px 18px #0004;
	}
	.promotion-choices.from-bottom {
		top: 50%;
		flex-direction: column-reverse;
	}
	.promotion-choice {
		flex: 1;
		min-height: 0;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		background: var(--board-light);
		cursor: pointer;
	}
	.promotion-choice img {
		width: 88%;
		height: 88%;
		object-fit: contain;
		pointer-events: none;
	}
	.promotion-choice:hover,
	.promotion-choice:focus-visible {
		background: #d8d58b;
		outline: none;
	}
	.promotion-choice:focus-visible {
		box-shadow: inset 0 0 0 3px var(--violet);
	}
	.promotion-dismiss {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		cursor: pointer;
	}

	.promotion-dismiss:focus-visible {
		outline: 3px solid var(--violet);
		outline-offset: -3px;
	}

	.promotion-choices {
		z-index: 1;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 760px) {
		.rank-label,
		.file-label {
			font-size: 7px;
		}
		.rank-label {
			top: 3px;
			left: 3px;
		}
		.file-label {
			right: 3px;
			bottom: 3px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.piece,
		.board-marker {
			transition: none;
			animation: none;
		}
	}
</style>
