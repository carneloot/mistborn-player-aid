import stylex from '@stylexjs/unplugin';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
		}),
		stylex.vite({
			runtimeInjection: false,
			styleResolution: 'property-specificity',
			useCSSLayers: false,
			unstable_moduleResolution: { type: 'commonJS', rootDir: '.' },
		}),
		react(),
	],
	resolve: {
		alias: { '@': new URL('./src', import.meta.url).pathname },
	},
	server: {
		allowedHosts: ['.onamp.dev'],
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
	},
});
