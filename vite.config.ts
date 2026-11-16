import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const { VITE_POSTHOG_PROJECT_TOKEN } = loadEnv(mode, process.cwd(), 'VITE_POSTHOG_');
	const projectToken = VITE_POSTHOG_PROJECT_TOKEN?.trim();
	if (projectToken && !/^phc_[a-zA-Z0-9]+$/.test(projectToken)) {
		throw new Error('VITE_POSTHOG_PROJECT_TOKEN must be a public PostHog project token (phc_).');
	}

	return {
		plugins: [
			sveltekit({
				preprocess: vitePreprocess(),
				adapter: adapter({ fallback: 'index.html' })
			})
		],
		server: {
			port: 5173,
			strictPort: true,
			watch: { ignored: ['**/android/**', '**/ios/**', '**/build/**'] }
		}
	};
});
