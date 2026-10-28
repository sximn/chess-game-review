export const API_VERSION = 1 as const;
export type ErrorCode =
	| 'INVALID_PGN'
	| 'INVALID_POSITION'
	| 'INVALID_OPTIONS'
	| 'ASSET_FETCH_FAILED'
	| 'NETWORK_MISMATCH'
	| 'INTEGRITY_FAILED'
	| 'UNSUPPORTED_BROWSER'
	| 'OUT_OF_MEMORY'
	| 'ENGINE_CRASHED'
	| 'CANCELLED';
export class EngineError extends Error {
	code: ErrorCode;
	retryable: boolean;
	constructor(code: ErrorCode, message: string, retryable = false) {
		super(message);
		this.name = 'EngineError';
		this.code = code;
		this.retryable = retryable;
	}
}
export type Score = {
	perspective: 'white';
	kind: 'cp' | 'mate';
	value: number;
	bound: 'exact' | 'lower' | 'upper';
	unit?: 'plies';
};
export type Position = { rootFen: string; movesUci: string[] };
export type SearchLimits = { maxNodes: number; maxTimeMs?: number; maxDepth?: number };
export type AnalyzeRequest = {
	apiVersion: 1;
	jobId: string;
	positionId: string;
	position: Position;
	limits: SearchLimits;
	multiPv: number;
	rootMoves?: string[];
};
export type Line = { rank: number; rootMove: string; pv: string[]; score: Score };
export type RawResult = {
	lines: Line[];
	depth: number;
	nodes: number;
	iterationNodes: number;
	completedIteration: boolean;
	reason?: 'time' | 'nodes' | 'depth' | 'terminal';
	outcome?: 'checkmate' | 'stalemate' | 'repetition' | 'fifty-move' | 'insufficient-material';
	winner?: 'white' | 'black' | null;
	terminalScore?: Score;
	error?: ErrorCode;
};
export type Identity = {
	engineCommit: string;
	buildHash: string;
	networkHash: string;
	settingsFingerprint: string;
};
export type AnalysisResult = RawResult &
	Identity & {
		apiVersion: 1;
		jobId: string;
		positionId: string;
		elapsedMs: number;
		completion: 'completed' | 'limited' | 'progress';
		sequence: number;
		memoryBytes: number;
	};
export type EngineEvent =
	| ({ type: 'progress' | 'completed'; result: AnalysisResult } & AnalysisResult)
	| ({
			type: 'failed' | 'cancelled';
			apiVersion: 1;
			jobId: string;
			positionId: string;
			error: { code: ErrorCode; retryable: boolean; message: string };
			elapsedMs: number;
			nodes: number;
			depth: number;
			completion: 'cancelled' | 'failed';
			lines: Line[];
			completedIteration: boolean;
	  } & Identity);
export type Capabilities = Identity & {
	apiVersion: 1;
	mode: 'scalar';
	threads: 1;
	sharedMemory: false;
	hashMiB: number;
	maximumMemoryMiB: 256;
	offlineAssets: boolean;
};
