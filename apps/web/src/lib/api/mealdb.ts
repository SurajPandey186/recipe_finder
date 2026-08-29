import type { Recipe, RecipeIngredient, RecipeSummary, SearchParams } from '$lib/types';

const BASE = 'https://www.themealdb.com/api/json/v1/1';

/** SvelteKit's `fetch` during `load`, or the global one elsewhere. */
type Fetch = typeof globalThis.fetch;

/**
 * TheMealDB returns `{"meals": null}` — not an empty array — when nothing
 * matches, so every response funnels through here.
 */
async function getJson<T>(fetchFn: Fetch, path: string): Promise<T | null> {
	const res = await fetch_or_throw(fetchFn, `${BASE}${path}`);
	const body = (await res.json()) as T | { meals: null };
	return body as T | null;
}

async function fetch_or_throw(fetchFn: Fetch, url: string) {
	const res = await fetchFn(url);
	if (!res.ok) {
		throw new Error(`TheMealDB request failed (${res.status}) for ${url}`);
	}
	return res;
}

/** Raw meal record as TheMealDB returns it. Indexed access covers strIngredient1..20. */
type RawMeal = Record<string, string | null> & {
	idMeal: string;
	strMeal: string;
	strMealThumb?: string | null;
};

/**
 * Flatten TheMealDB's parallel `strIngredient1..20` / `strMeasure1..20` fields
 * into a clean array, dropping the empty trailing slots.
 */
export function extractIngredients(meal: RawMeal): RecipeIngredient[] {
	const out: RecipeIngredient[] = [];
	for (let i = 1; i <= 20; i++) {
		const name = meal[`strIngredient${i}`]?.trim();
		const measure = meal[`strMeasure${i}`]?.trim();
		if (name) out.push({ name, measure: measure || '' });
	}
	return out;
}

/** Convert a raw meal into the app's normalised shape. */
export function normalizeMeal(meal: RawMeal): Recipe {
	return {
		id: meal.idMeal,
		title: meal.strMeal,
		thumbnail: meal.strMealThumb ?? undefined,
		category: meal.strCategory ?? undefined,
		area: meal.strArea ?? undefined,
		instructions: meal.strInstructions ?? undefined,
		ingredients: extractIngredients(meal),
		tags:
			meal.strTags
				?.split(',')
				.map((t) => t.trim())
				.filter(Boolean) ?? [],
		source: meal.strSource ?? meal.strYoutube ?? undefined,
		userCreated: false
	};
}

function toSummary(meal: RawMeal): RecipeSummary {
	return {
		id: meal.idMeal,
		title: meal.strMeal,
		thumbnail: meal.strMealThumb ?? undefined,
		category: meal.strCategory ?? undefined,
		area: meal.strArea ?? undefined,
		userCreated: false
	};
}

/**
 * Search and filter recipes.
 *
 * TheMealDB has no combined search+filter endpoint, and its two relevant
 * endpoints behave differently:
 *
 *   - `search.php?s=` returns FULL meal objects (category and area included).
 *   - `filter.php?c=` / `?a=` return PARTIAL objects — id, title and thumbnail
 *     only — so their results cannot be narrowed further without an extra
 *     lookup per recipe.
 *
 * So: when a search term is present we search and intersect on the filters
 * client-side (cheap, because search results are complete). When only filters
 * are present we use `filter.php`, and when both a category and an area are
 * given we intersect the two filter responses by id.
 */
export async function searchRecipes(
	fetchFn: Fetch,
	{ q, category, area }: SearchParams
): Promise<RecipeSummary[]> {
	const term = q?.trim();

	if (term) {
		const data = await getJson<{ meals: RawMeal[] | null }>(
			fetchFn,
			`/search.php?s=${encodeURIComponent(term)}`
		);
		const meals = data?.meals ?? [];
		return meals
			.filter((m) => !category || m.strCategory === category)
			.filter((m) => !area || m.strArea === area)
			.map(toSummary);
	}

	if (category && area) {
		const [byCategory, byArea] = await Promise.all([
			filterBy(fetchFn, 'c', category),
			filterBy(fetchFn, 'a', area)
		]);
		const areaIds = new Set(byArea.map((m) => m.id));
		return byCategory.filter((m) => areaIds.has(m.id));
	}

	if (category) return filterBy(fetchFn, 'c', category);
	if (area) return filterBy(fetchFn, 'a', area);

	// No query and no filters: show a browsable default rather than an empty page.
	return browseDefault(fetchFn);
}

async function filterBy(fetchFn: Fetch, key: 'c' | 'a', value: string): Promise<RecipeSummary[]> {
	const data = await getJson<{ meals: RawMeal[] | null }>(
		fetchFn,
		`/filter.php?${key}=${encodeURIComponent(value)}`
	);
	return (data?.meals ?? []).map(toSummary);
}

/** Landing-page content: a spread across a few categories so the grid isn't empty. */
async function browseDefault(fetchFn: Fetch): Promise<RecipeSummary[]> {
	const seeds = ['Chicken', 'Dessert', 'Pasta', 'Seafood'];
	const batches = await Promise.all(seeds.map((c) => filterBy(fetchFn, 'c', c)));
	// Interleave so the first row isn't four desserts.
	const out: RecipeSummary[] = [];
	const longest = Math.max(...batches.map((b) => b.length));
	for (let i = 0; i < longest; i++) {
		for (const batch of batches) {
			if (batch[i]) out.push(batch[i]);
		}
	}
	return out.slice(0, 48);
}

/** Full details for one recipe. Returns null when the id is unknown. */
export async function getRecipeById(fetchFn: Fetch, id: string): Promise<Recipe | null> {
	const data = await getJson<{ meals: RawMeal[] | null }>(
		fetchFn,
		`/lookup.php?i=${encodeURIComponent(id)}`
	);
	const meal = data?.meals?.[0];
	return meal ? normalizeMeal(meal) : null;
}

export async function listCategories(fetchFn: Fetch): Promise<string[]> {
	const data = await getJson<{ meals: { strCategory: string }[] | null }>(
		fetchFn,
		'/list.php?c=list'
	);
	return (data?.meals ?? []).map((m) => m.strCategory).filter(Boolean);
}

export async function listAreas(fetchFn: Fetch): Promise<string[]> {
	const data = await getJson<{ meals: { strArea: string }[] | null }>(fetchFn, '/list.php?a=list');
	return (data?.meals ?? []).map((m) => m.strArea).filter(Boolean);
}
