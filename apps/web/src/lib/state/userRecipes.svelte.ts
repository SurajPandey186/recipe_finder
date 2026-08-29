import type { Recipe } from '$lib/types';
import { persisted } from './persisted.svelte';

/**
 * Recipes created by the user.
 *
 * Ids are prefixed `user-` so they can never collide with TheMealDB's numeric
 * ids; the details route uses that prefix to decide whether to hit the API or
 * read from here. See `isUserRecipeId`.
 */
const store = persisted<Recipe[]>('rf:user-recipes', []);

export const USER_ID_PREFIX = 'user-';

export function isUserRecipeId(id: string): boolean {
	return id.startsWith(USER_ID_PREFIX);
}

function nextId(): string {
	return `${USER_ID_PREFIX}${crypto.randomUUID()}`;
}

export const userRecipes = {
	get all(): Recipe[] {
		return store.current;
	},

	get count(): number {
		return store.current.length;
	},

	get(id: string): Recipe | undefined {
		return store.current.find((r) => r.id === id);
	},

	create(data: Omit<Recipe, 'id' | 'userCreated'>): Recipe {
		const recipe: Recipe = { ...data, id: nextId(), userCreated: true };
		store.current = [...store.current, recipe];
		return recipe;
	},

	update(id: string, data: Omit<Recipe, 'id' | 'userCreated'>): Recipe | undefined {
		const existing = store.current.find((r) => r.id === id);
		if (!existing) return undefined;
		const updated: Recipe = { ...data, id, userCreated: true };
		store.current = store.current.map((r) => (r.id === id ? updated : r));
		return updated;
	},

	remove(id: string) {
		store.current = store.current.filter((r) => r.id !== id);
	},

	refresh() {
		store.refresh();
	}
};

export interface RecipeFormValues {
	title: string;
	thumbnail: string;
	category: string;
	area: string;
	instructions: string;
	ingredients: { name: string; measure: string }[];
}

export type RecipeErrors = Partial<Record<'title' | 'instructions' | 'ingredients' | 'thumbnail', string>>;

/**
 * Validate the recipe form. Pure and synchronous so it can be unit tested and
 * reused by both the create and edit routes.
 */
export function validateRecipe(values: RecipeFormValues): RecipeErrors {
	const errors: RecipeErrors = {};

	if (!values.title.trim()) {
		errors.title = 'Title is required.';
	} else if (values.title.trim().length < 3) {
		errors.title = 'Title must be at least 3 characters.';
	}

	if (!values.instructions.trim()) {
		errors.instructions = 'Instructions are required.';
	} else if (values.instructions.trim().length < 20) {
		errors.instructions = 'Please write at least 20 characters of instructions.';
	}

	const filled = values.ingredients.filter((i) => i.name.trim());
	if (filled.length === 0) {
		errors.ingredients = 'Add at least one ingredient.';
	}

	if (values.thumbnail.trim() && !/^https?:\/\/\S+$/i.test(values.thumbnail.trim())) {
		errors.thumbnail = 'Image URL must start with http:// or https://';
	}

	return errors;
}

/** Strip empty ingredient rows and trim everything before saving. */
export function toRecipePayload(values: RecipeFormValues): Omit<Recipe, 'id' | 'userCreated'> {
	return {
		title: values.title.trim(),
		thumbnail: values.thumbnail.trim() || undefined,
		category: values.category.trim() || undefined,
		area: values.area.trim() || undefined,
		instructions: values.instructions.trim(),
		ingredients: values.ingredients
			.filter((i) => i.name.trim())
			.map((i) => ({ name: i.name.trim(), measure: i.measure.trim() })),
		tags: []
	};
}
