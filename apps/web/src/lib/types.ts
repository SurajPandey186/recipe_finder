export interface RecipeIngredient {
	name: string;
	measure: string;
}

/** Normalised recipe shape used everywhere in the app and by the UI library. */
export interface Recipe {
	id: string;
	title: string;
	thumbnail?: string;
	category?: string;
	area?: string;
	instructions?: string;
	ingredients?: RecipeIngredient[];
	tags?: string[];
	source?: string;
	/** True for recipes the user created locally, false for TheMealDB results. */
	userCreated?: boolean;
}

/** A recipe summary — what list/filter endpoints can return without a follow-up lookup. */
export type RecipeSummary = Pick<Recipe, 'id' | 'title' | 'thumbnail' | 'category' | 'area' | 'userCreated'>;

export interface SearchParams {
	q?: string;
	category?: string;
	area?: string;
}
