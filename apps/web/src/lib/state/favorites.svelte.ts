import type { RecipeSummary } from '$lib/types';
import { persisted } from './persisted.svelte';

/**
 * Favourites store.
 *
 * Stores the whole summary rather than just the id so the favourites page can
 * render without N API lookups, and so favourited user-created recipes survive
 * even if the original is later edited.
 */
const store = persisted<RecipeSummary[]>('rf:favorites', []);

export const favorites = {
	get all(): RecipeSummary[] {
		return store.current;
	},

	get count(): number {
		return store.current.length;
	},

	has(id: string): boolean {
		return store.current.some((r) => r.id === id);
	},

	add(recipe: RecipeSummary) {
		if (favorites.has(recipe.id)) return;
		store.current = [...store.current, recipe];
	},

	remove(id: string) {
		store.current = store.current.filter((r) => r.id !== id);
	},

	/** Add or remove depending on current membership. Returns the new state. */
	toggle(recipe: RecipeSummary): boolean {
		if (favorites.has(recipe.id)) {
			favorites.remove(recipe.id);
			return false;
		}
		favorites.add(recipe);
		return true;
	},

	refresh() {
		store.refresh();
	}
};
