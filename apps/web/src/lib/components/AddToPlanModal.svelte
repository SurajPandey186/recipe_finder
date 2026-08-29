<script lang="ts">
	import { listen } from '$lib/actions/listen';
	import { DAYS, MEALS, planner, type Day, type MealSlot } from '$lib/state/planner.svelte';
	import type { RecipeSummary } from '$lib/types';

	interface Props {
		recipe: RecipeSummary | null;
		onclose: () => void;
	}

	let { recipe, onclose }: Props = $props();

	let day = $state<Day>(DAYS[0]);
	let slot = $state<MealSlot>(MEALS[0]);

	function confirm() {
		if (!recipe) return;
		planner.assign(day, slot, recipe);
		onclose();
	}
</script>

<!-- rf-modal is a library component whose entire content comes from slots. -->
<rf-modal
	open={!!recipe}
	heading="Add to meal plan"
	use:listen={{ rfClose: onclose }}
>
	{#if recipe}
		<p style="margin:0 0 1rem">
			Schedule <strong>{recipe.title}</strong> for:
		</p>

		<div class="row">
			<label class="field">
				<span class="field__label">Day</span>
				<select class="field__control" bind:value={day}>
					{#each DAYS as d}
						<option value={d}>{d}</option>
					{/each}
				</select>
			</label>

			<label class="field">
				<span class="field__label">Meal</span>
				<select class="field__control" bind:value={slot}>
					{#each MEALS as m}
						<option value={m}>{m}</option>
					{/each}
				</select>
			</label>
		</div>

		{#if planner.get(day, slot)}
			<p class="field__hint">
				{day} {slot.toLowerCase()} currently holds
				<strong>{planner.get(day, slot)?.title}</strong> — saving will replace it.
			</p>
		{/if}
	{/if}

	<div slot="footer" style="display:flex; gap:.5rem; justify-content:flex-end">
		<button class="btn" type="button" onclick={onclose}>Cancel</button>
		<button class="btn btn--primary" type="button" onclick={confirm}>Add to plan</button>
	</div>
</rf-modal>
