import { Chess } from 'chess.js';
import type { AnalysisResult, AnalyzeRequest, Identity, Score } from 'chess-engine-kit';

// Explicit order keeps cache keys stable across object construction and SDK implementations.
export function cacheIdentity(identity: Identity) {
	return [
		identity.engineId,
		identity.engineName,
		identity.engineVersion,
		identity.sourceRevision,
		identity.buildHash,
		identity.adapterHash,
		identity.modelHash,
		identity.settingsFingerprint
	];
}

function counter(value: unknown) {
	return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);
}

function score(value: Score | undefined) {
	return (
		!!value &&
		value.perspective === 'white' &&
		Number.isSafeInteger(value.value) &&
		['exact', 'lower', 'upper'].includes(value.bound) &&
		(value.kind === 'cp' || (value.kind === 'mate' && value.unit === 'plies'))
	);
}

function move(game: Chess, uci: string) {
	if (typeof uci !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
		throw Error();
	}
	game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
}

// IndexedDB is application-owned, untrusted storage. Live SDK output is validated by the SDK.
export function isCachedResult(
	value: unknown,
	request: AnalyzeRequest,
	identity: Identity
): value is AnalysisResult {
	try {
		if (!value || typeof value !== 'object') {
			return false;
		}

		const result = value as AnalysisResult;
		if (
			JSON.stringify(cacheIdentity(result)) !== JSON.stringify(cacheIdentity(identity)) ||
			result.apiVersion !== request.apiVersion ||
			result.completedIteration !== true ||
			!['completed', 'limited'].includes(result.completion) ||
			result.error !== undefined ||
			!counter(result.depth) ||
			!counter(result.nodes) ||
			(result.iterationNodes !== undefined && !counter(result.iterationNodes)) ||
			(result.iterationNodes != null &&
				result.nodes !== null &&
				result.iterationNodes > result.nodes) ||
			(result.memoryBytes !== undefined && !counter(result.memoryBytes)) ||
			!Number.isFinite(result.elapsedMs) ||
			result.elapsedMs < 0 ||
			!Number.isSafeInteger(result.sequence) ||
			result.sequence < 1 ||
			typeof result.jobId !== 'string' ||
			typeof result.positionId !== 'string' ||
			!Array.isArray(result.lines) ||
			result.lines.length > request.multiPv
		) {
			return false;
		}

		const root = new Chess(request.position.rootFen);
		for (const uci of request.position.movesUci) {
			move(root, uci);
		}

		const outcome = root.isCheckmate()
			? 'checkmate'
			: root.isStalemate()
				? 'stalemate'
				: root.isThreefoldRepetition()
					? 'repetition'
					: root.isDrawByFiftyMoves()
						? 'fifty-move'
						: root.isInsufficientMaterial()
							? 'insufficient-material'
							: undefined;
		if (outcome) {
			const winner = outcome === 'checkmate' ? (root.turn() === 'w' ? 'black' : 'white') : null;
			return (
				result.reason === 'terminal' &&
				result.completion === 'completed' &&
				result.outcome === outcome &&
				result.winner === winner &&
				result.lines.length === 0 &&
				score(result.terminalScore) &&
				result.terminalScore!.kind === (outcome === 'checkmate' ? 'mate' : 'cp') &&
				result.terminalScore!.value === 0 &&
				result.terminalScore!.bound === 'exact'
			);
		}
		if (
			result.outcome !== undefined ||
			result.winner != null ||
			result.terminalScore !== undefined ||
			!['nodes', 'time', 'depth'].includes(result.reason!) ||
			!result.lines.length ||
			result.completion !== (result.reason === 'depth' ? 'completed' : 'limited')
		) {
			return false;
		}

		const roots = new Set<string>();
		return result.lines.every((line, index) => {
			if (
				!line ||
				line.rank !== index + 1 ||
				roots.has(line.rootMove) ||
				!score(line.score) ||
				!Array.isArray(line.pv) ||
				!line.pv.length ||
				line.pv.length > 256 ||
				line.pv[0] !== line.rootMove ||
				(request.rootMoves && !request.rootMoves.includes(line.rootMove))
			) {
				return false;
			}

			roots.add(line.rootMove);
			const game = new Chess(root.fen());
			for (const uci of line.pv) {
				move(game, uci);
			}

			return true;
		});
	} catch {
		return false;
	}
}
