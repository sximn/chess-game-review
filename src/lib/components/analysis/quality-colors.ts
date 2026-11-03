import type { MoveQuality } from '#lib/engine/classification.js';

// Classification colors identify chess markers. Text needs a theme-aware variant
// so the same quality remains readable on paper, selection, and tinted badges.
export function qualityTextColor(name: MoveQuality['name']) {
	return `var(--quality-${name.toLowerCase()}-text)`;
}
