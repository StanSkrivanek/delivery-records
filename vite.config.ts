import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';


export default defineConfig({
	...(process.env.NODE_ENV === 'development'
		? {
				vitePlugin: {
					inspector: {
						// change shortcut
						toggleKeyCombo: 'meta-shift', // SHIFT + COMMAND
						// hold and release key to toggle inspector mode
						holdMode: true,
						// show or hide the inspector option
						showToggleButton: 'always',
						// inspector position
						toggleButtonPos: 'top-right'
					}
				}
			}
		: {}),

	plugins: [sveltekit(), devtoolsJson()],
	optimizeDeps: {
		exclude: ['@jsquash/webp', '@jsquash/avif', '@jsquash/jpeg', '@jsquash/png', '@jsquash/resize']
	},
	server: {
		fs: {
			allow: ['..']
		}
	}
});
