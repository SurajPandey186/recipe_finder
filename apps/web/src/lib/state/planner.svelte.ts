import type { RecipeSummary } from '$lib/types';
import { persisted } from './persisted.svelte';

export const DAYS = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday'
] as const;

export const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;

export type Day = (typeof DAYS)[number];
export type MealSlot = (typeof MEALS)[number];

/** `plan['Monday']['Dinner']` → the assigned recipe, or undefined. */
type Plan = Partial<Record<Day, Partial<Record<MealSlot, RecipeSummary>>>>;

const store = persisted<Plan>('rf:planner', {});

export const planner = {
	get plan(): Plan {
		return store.current;
	},

	get(day: Day, slot: MealSlot): RecipeSummary | undefined {
		return store.current[day]?.[slot];
	},

	assign(day: Day, slot: MealSlot, recipe: RecipeSummary) {
		store.current = {
			...store.current,
			[day]: { ...store.current[day], [slot]: recipe }
		};
	},

	remove(day: Day, slot: MealSlot) {
		const dayPlan = { ...store.current[day] };
		delete dayPlan[slot];
		store.current = { ...store.current, [day]: dayPlan };
	},

	/** Move an assignment between slots — used by the planner's change action. */
	move(from: { day: Day; slot: MealSlot }, to: { day: Day; slot: MealSlot }) {
		const recipe = planner.get(from.day, from.slot);
		if (!recipe) return;
		planner.remove(from.day, from.slot);
		planner.assign(to.day, to.slot, recipe);
	},

	clear() {
		store.current = {};
	},

	get plannedCount(): number {
		return Object.values(store.current).reduce(
			(sum, day) => sum + Object.keys(day ?? {}).length,
			0
		);
	},

	refresh() {
		store.refresh();
	}
};
