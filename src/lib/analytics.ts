import { dev } from '$app/env';
import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_PROJECT_TOKEN } from '$app/env/public';
import { Capacitor } from '@capacitor/core';
import type { PostHog } from 'posthog-js/dist/module.slim.no-external';

const eventFields = {
	$pageview: [],
	game_imported: ['import_method'],
	game_exported: ['move_count'],
	board_flipped: ['orientation'],
	analysis_panel_opened: ['position_index', 'total_move_count'],
	analysis_variation_explored: ['root_position_index', 'variation_move_count']
} as const;

type AnalyticsEvent = keyof typeof eventFields;
type ProductEvent = Exclude<AnalyticsEvent, '$pageview'>;
type EventProperties = Record<string, string | number>;
let client: Promise<PostHog> | undefined;

export function trackPageview(url: URL, route: string) {
	capture('$pageview', new URL(route, url.href));
}

export function trackEvent<Event extends ProductEvent>(
	event: Event,
	properties: Record<(typeof eventFields)[Event][number], string | number>
) {
	capture(event, new URL(window.location.pathname, window.location.href), properties);
}

function capture(event: AnalyticsEvent, url: URL, properties: EventProperties = {}) {
	const token = PUBLIC_POSTHOG_PROJECT_TOKEN;
	const host = PUBLIC_POSTHOG_HOST;
	if (dev || !token || !host) return;

	client ??= import('posthog-js/dist/module.slim.no-external').then(({ default: posthog }) => {
		posthog.init(token, {
			api_host: host,
			advanced_disable_flags: true,
			autocapture: false,
			capture_exceptions: false,
			capture_pageview: false,
			capture_pageleave: false,
			disable_session_recording: true,
			person_profiles: 'never',
			persistence: 'memory',
			respect_dnt: true,
			save_campaign_params: false,
			save_referrer: false,
			before_send(data) {
				if (!data || !Object.prototype.hasOwnProperty.call(eventFields, data.event)) return null;
				const { token, distinct_id, $session_id, $current_url, $pathname, $host, app_platform } =
					data.properties;
				// The SDK adds URL, referrer and session entry properties to custom events too.
				const allowedProperties: Record<string, unknown> = {
					token,
					distinct_id,
					$session_id,
					$current_url,
					$pathname,
					$host,
					app_platform,
					$process_person_profile: false,
					$geoip_disable: true
				};
				for (const key of eventFields[data.event as AnalyticsEvent]) {
					allowedProperties[key] = data.properties[key];
				}
				return {
					event: data.event,
					uuid: data.uuid,
					timestamp: data.timestamp,
					properties: allowedProperties
				};
			}
		});
		return posthog;
	});

	void client
		.then((posthog) =>
			posthog.capture(event, {
				...properties,
				$current_url: url.href,
				$pathname: url.pathname,
				$host: url.hostname,
				app_platform: Capacitor.getPlatform()
			})
		)
		.catch(() => {
			/* Analytics is optional, including when the app is offline. */
		});
}
