import type { HandleClientError } from '@sveltejs/kit/hooks';
import posthog from 'posthog-js';

export function init() {
	const token = import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
	const host = import.meta.env.PUBLIC_POSTHOG_HOST;
	if (!token || !host) {
		if (import.meta.env.DEV) {
			const variable = token ? 'PUBLIC_POSTHOG_HOST' : 'PUBLIC_POSTHOG_PROJECT_TOKEN';
			console.error(
				`${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variable} is configured`
			);
		}
		return;
	}

	posthog.init(token, {
		api_host: host,
		capture_exceptions: true,
		logs: {
			serviceName: 'up-a-pawn-web',
			environment: import.meta.env.DEV ? 'development' : 'production'
		}
	});
}

export const handleError: HandleClientError = ({ error, kind }) => {
	if (kind !== 'framework' || error.status !== 404) {
		posthog.captureException(error);
	}
};
