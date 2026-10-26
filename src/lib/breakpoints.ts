import { createContext } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

function createBreakpoints() {
	const mobile = new MediaQuery('(max-width: 760px)', true);

	return {
		get mobile() {
			return mobile.current;
		}
	};
}

type Breakpoints = ReturnType<typeof createBreakpoints>;

const [getBreakpoints, setBreakpoints] = createContext<Breakpoints>();

export const useBreakpoints = getBreakpoints;

export function initializeBreakpoints() {
	return setBreakpoints(createBreakpoints());
}
