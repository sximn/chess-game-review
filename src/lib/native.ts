import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { app } from './state.svelte';

export async function initializeNative() {
	if (!Capacitor.isNativePlatform()) return () => {};
	const handles = await Promise.all([
		App.addListener('backButton', ({ canGoBack }) => {
			if (app.menuOpen) {
				app.menuOpen = false;
				return;
			}
			if (app.helpOpen) {
				app.helpOpen = false;
				return;
			}
			if (app.importOpen) {
				app.importOpen = false;
				return;
			}
			if (app.analysisOpen) {
				app.analysisOpen = false;
				return;
			}
			if (canGoBack) window.history.back();
			else void App.minimizeApp();
		}),
		Keyboard.addListener('keyboardWillShow', () =>
			document.documentElement.classList.add('keyboard-open')
		),
		Keyboard.addListener('keyboardWillHide', () =>
			document.documentElement.classList.remove('keyboard-open')
		)
	]);
	return () => {
		for (const handle of handles) void handle.remove();
	};
}

export function setNativeTheme(dark: boolean) {
	if (Capacitor.isNativePlatform()) {
		void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(
			console.warn
		);
	}
}
