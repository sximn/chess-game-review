import type { LucideIcon } from '@lucide/svelte';

export type TabItem = {
	value: string;
	label: string;
	icon?: LucideIcon;
	disabled?: boolean;
};
