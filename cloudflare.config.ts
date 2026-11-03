import { defineConfig } from 'cf/config';

export default defineConfig({
	worker: {
		name: 'up-a-pawn',
		compatibilityDate: '2026-11-02',
		workersDev: true,
		assets: { notFoundHandling: 'single-page-application' }
	}
});
