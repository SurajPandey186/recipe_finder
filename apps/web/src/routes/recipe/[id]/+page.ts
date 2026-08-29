import { getRecipeById } from '$lib/api/mealdb';
import { isUserRecipeId } from '$lib/state/userRecipes.svelte';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	// User-created recipes live in localStorage, which `load` cannot reach on the
	// server. Signal that to the page, which resolves them from the store after
	// hydration.
	if (isUserRecipeId(params.id)) {
		return { recipe: null, userCreated: true, id: params.id };
	}

	const recipe = await getRecipeById(fetch, params.id);
	if (!recipe) error(404, 'Recipe not found');

	return { recipe, userCreated: false, id: params.id };
};
