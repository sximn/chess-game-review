import { defineWranglerConfig } from 'wrangler/experimental-config';

// Package the completed SvelteKit + offline build; do not rebuild the app here.
export default defineWranglerConfig({
	assetsDirectory: './build',
	types: { generate: false }
});
