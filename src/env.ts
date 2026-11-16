import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	POSTHOG_PROJECT_TOKEN: {
		public: true,
		static: true,
		description: 'Public PostHog Project API key (phc_).',
		schema: (value) => {
			const token = value?.trim();
			if (token && !/^phc_[a-zA-Z0-9]+$/.test(token)) {
				throw new Error('Use a public PostHog project token (phc_).');
			}
			return token || undefined;
		}
	},
	POSTHOG_HOST: {
		public: true,
		static: true,
		description: 'PostHog ingestion host from the project settings.',
		schema: (value) => value?.trim() || undefined
	}
});
