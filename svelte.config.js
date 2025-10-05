import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	},
	vitePlugin: {
		// Enable inspector only in development to avoid PostCSS issues in preview/prod
		inspector: isDev
			? {
					// change shortcut
					toggleKeyCombo: 'meta-shift', // SHIFT + COMMAND
					// hold and release key to toggle inspector mode
					holdMode: true,
					// show or hide the inspector option
					showToggleButton: 'always',
					// inspector position
					toggleButtonPos: 'top-right'
				}
			: false
	}
};

export default config;
