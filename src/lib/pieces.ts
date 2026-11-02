import type { Color, PieceSymbol } from 'chess.js';

export const pieceSets = [
	{ id: 'classic', label: 'Classic' },
	{ id: 'custom', label: 'Custom' }
] as const;

export type PieceSet = (typeof pieceSets)[number]['id'];

export function pieceSrc(set: PieceSet, color: Color, type: PieceSymbol) {
	const directory = set === 'custom' ? '/pieces/custom' : '/pieces';
	return `${directory}/${color}${type.toUpperCase()}.svg`;
}
