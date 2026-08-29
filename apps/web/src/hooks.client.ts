import type { ClientInit } from '@sveltejs/kit';

/**
 * Register the Stencil web components before the app hydrates.
 *
 * SvelteKit awaits `init` before mounting, which matters: if the custom
 * elements are still unregistered when Svelte sets `<rf-recipe-card recipe={...}>`,
 * Svelte falls back to a heuristic and may write an attribute instead of the
 * property. Defining them up front means Svelte sees the real property setters
 * and complex props (objects, arrays) are always passed by reference.
 *
 * This file only ever runs in the browser, so `customElements` is guaranteed
 * to exist.
 */
export const init: ClientInit = async () => {
	const { defineCustomElements } = await import('@surajbhushanpandey/recipe-ui');
	defineCustomElements();
};
