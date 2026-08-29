import { listAreas, listCategories, searchRecipes } from '$lib/api/mealdb';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const area = url.searchParams.get('area') ?? '';

	// Filter option lists are static enough to fetch alongside the results.
	const [recipes, categories, areas] = await Promise.all([
		searchRecipes(fetch, { q, category, area }),
		listCategories(fetch),
		listAreas(fetch)
	]);

	return { recipes, categories, areas, q, category, area };
};
