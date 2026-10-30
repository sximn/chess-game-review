import type { Page } from '@playwright/test';

export async function readEngineAssetUrls(page: Page, origin = '') {
	await page.goto(origin + '/diagnostics');
	return JSON.parse((await page.getByTestId('engine-asset-urls').textContent())!) as {
		worker: string;
		wasm: string;
	};
}
