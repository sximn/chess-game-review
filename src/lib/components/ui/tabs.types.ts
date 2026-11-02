import type { Component } from 'svelte';
import type { Icon, IconProps } from 'lucide-svelte';

export type TabItem = {
	value: string;
	label: string;
	icon?: Component<IconProps> | typeof Icon;
	disabled?: boolean;
};
