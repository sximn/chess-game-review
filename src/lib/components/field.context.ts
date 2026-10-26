import { getContext, setContext } from 'svelte';
import type { AriaAttributes } from 'svelte/elements';

const FIELD_CONTEXT = Symbol('field');
export type FieldContext = {
	readonly controlId: string;
	readonly descriptionId: string | undefined;
	readonly errorId: string | undefined;
	readonly invalid: boolean;
};
export function provideFieldContext(field: FieldContext) {
	setContext(FIELD_CONTEXT, field);
}
export function getFieldContext(): FieldContext | undefined {
	return getContext(FIELD_CONTEXT);
}
export function fieldControlAttributes(
	field: FieldContext | undefined,
	id?: string | null,
	describedBy?: string | null,
	invalid?: AriaAttributes['aria-invalid']
) {
	const descriptions = new Set(
		[describedBy, field?.descriptionId, field?.errorId]
			.flatMap((value) => value?.split(/\s+/) ?? [])
			.filter(Boolean)
	);
	return {
		id: id ?? field?.controlId,
		'aria-describedby': [...descriptions].join(' ') || undefined,
		'aria-invalid': invalid ?? (field?.invalid ? true : undefined)
	};
}
