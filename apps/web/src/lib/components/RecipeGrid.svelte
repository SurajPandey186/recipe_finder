<script lang="ts">
	import { goto } from '$app/navigation';
	import { listen } from '$lib/actions/listen';
	import { favorites } from '$lib/state/favorites.svelte';
	import { planner, type Day, type MealSlot } from '$lib/state/planner.svelte';
	import AddToPlanModal from './AddToPlanModal.svelte';
	import type { RecipeSummary } from '$lib/types';

	interface Props {
		recipes: RecipeSummary[];
		/**
		 * When set, the planner sent the user here to fill a specific slot, so
		 * "Add to plan" assigns straight into it instead of opening the picker.
		 */
		assignTarget?: { day: Day; slot: MealSlot } | null;
		emptyIcon?: string;
		emptyMessage?: string;
		emptyChildren?: import('svelte').Snippet;
	}

	let {
		recipes,
		assignTarget = null,
		emptyIcon = '🍽️',
		emptyMessage = 'No recipes found',
		emptyChildren
	}: Props = $props();

	let planning = $state<RecipeSummary | null>(null);

	function onOpen(event: Event) {
		const { id } = (event as CustomEvent<{ id: string }>).detail;
		goto(`/recipe/${id}`);
	}

	function planClicked(recipe: RecipeSummary) {
		if (assignTarget) {
			planner.assign(assignTarget.day, assignTarget.slot, recipe);
			goto('/planner');
			return;
		}
		planning = recipe;
	}
</script>

{#if recipes.length === 0}
	<rf-empty-state icon={emptyIcon} message={emptyMessage}>
		{#if emptyChildren}{@render emptyChildren()}{/if}
	</rf-empty-state>
{:else}
	<div class="grid">
		{#each recipes as recipe (recipe.id)}
			<!--
				`recipe` is passed as an object property, not an attribute, and the
				card's custom events are handled here. The "Add to plan" button is
				projected into the card's `actions` slot.
			-->
			<rf-recipe-card
				{recipe}
				favorite={favorites.has(recipe.id)}
				use:listen={{ rfFavoriteToggle: () => favorites.toggle(recipe), rfOpen: onOpen }}
			>
				<button
					slot="actions"
					class="btn btn--sm btn--block"
					class:btn--primary={!!assignTarget}
					type="button"
					onclick={() => planClicked(recipe)}
				>
					{assignTarget ? `Put in ${assignTarget.slot.toLowerCase()}` : '+ Add to plan'}
				</button>
			</rf-recipe-card>
		{/each}
	</div>
{/if}

<AddToPlanModal recipe={planning} onclose={() => (planning = null)} />
