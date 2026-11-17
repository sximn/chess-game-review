import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_POSTHOG_PROJECT_TOKEN: {
		public: true,
		static: true,
		description: 'Public PostHog project API key (phc_).',
		schema(value) {
			const token = value?.trim();
			if (token && !/^phc_[a-zA-Z0-9]+$/.test(token)) {
				throw new Error('Use a public PostHog project API key (phc_).');
			}
			return token || undefined;
		}
	},
	PUBLIC_POSTHOG_HOST: {
		public: true,
		static: true,
		description: 'HTTPS ingestion origin for the PostHog project.',
		schema(value) {
			const host = value?.trim();
			if (!host) return undefined;
			const url = new URL(host);
			if (url.protocol !== 'https:' || url.href !== url.origin + '/') {
				throw new Error('Use the HTTPS ingestion origin from PostHog project settings.');
			}
			return url.origin;
		}
	}
});
