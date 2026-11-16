import type { PostHog } from 'posthog-js/dist/module.slim.no-external';

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim();
let client: Promise<PostHog | undefined> | undefined;

export function trackPageview(origin: string, route: string) {
	if (import.meta.env.DEV || !projectToken || !apiHost) return;

	client ??= import('posthog-js/dist/module.slim.no-external')
		.then(({ default: posthog }) => {
			posthog.init(projectToken, {
				api_host: apiHost,
				advanced_disable_flags: true,
				autocapture: false,
				capture_pageview: false,
				capture_pageleave: false,
				disable_scroll_properties: true,
				person_profiles: 'never',
				persistence: 'memory',
				respect_dnt: true,
				save_campaign_params: false,
				save_referrer: false,
				before_send(event) {
					if (event.event !== '$pageview') return null;
					const properties = event.properties;
					// Keep the analytics IDs and the app's route. The SDK also adds raw URLs.
					return {
						event: event.event,
						uuid: event.uuid,
						timestamp: event.timestamp,
						properties: {
							token: properties.token,
							distinct_id: properties.distinct_id,
							$session_id: properties.$session_id,
							$current_url: properties.$current_url,
							$pathname: properties.$pathname,
							$process_person_profile: false,
							$geoip_disable: true
						}
					};
				}
			});
			return posthog;
		})
		.catch(() => undefined);

	void client
		.then((posthog) =>
			posthog?.capture('$pageview', { $current_url: origin + route, $pathname: route })
		)
		.catch(() => {
			/* Analytics is optional, including when the app is offline. */
		});
}
