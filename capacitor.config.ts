import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
	appId: 'com.simonukus.upapawn',
	appName: 'Up a Pawn',
	webDir: 'build',
	backgroundColor: '#f5f5f5',
	plugins: {
		SystemBars: { insetsHandling: 'native' },
		Keyboard: { resize: KeyboardResize.Native, resizeOnFullScreen: true }
	}
};
export default config;
