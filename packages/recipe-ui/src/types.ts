/**
 * Shape of a recipe as consumed by every component in this library.
 *
 * Deliberately provider-agnostic: the host application is responsible for
 * normalising whatever its API returns (TheMealDB, Spoonacular, a local store)
 * into this shape before handing it to a component.
 */
export interface RecipeIngredient {
  name: string;
  measure: string;
}

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
  /** True when the recipe was created by the user rather than fetched from an API. */
  userCreated?: boolean;
}

/** A single assignable position in the weekly planner, e.g. Monday / dinner. */
export interface PlannerSlotRef {
  day: string;
  slot: string;
}
