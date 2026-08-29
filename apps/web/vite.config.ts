import vercel from '@sveltejs/adapter-vercel';
import auto from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// adapter-vercel writes symlinks into .vercel/output, which Windows refuses
// unless Developer Mode is enabled. Vercel's own build environment sets
// VERCEL=1 and gets the real adapter; local builds fall back to adapter-auto so
// `npm run build` still type-checks and bundles on any machine.
const adapter = process.env.VERCEL ? vercel() : auto();

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for our own code, but leave library code alone.
				runes: ({ filename }) => (filename.includes('node_modules') ? undefined : true)
			},
			adapter
		})
	]
});
