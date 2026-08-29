<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { listen } from '$lib/actions/listen';
	import { DAYS, MEALS, planner, type Day, type MealSlot } from '$lib/state/planner.svelte';

	let hydrated = $state(false);
	onMount(() => {
		planner.refresh();
		hydrated = true;
	});

	/** Empty slot clicked → go pick a recipe, remembering where it should land. */
	function onAssign(event: Event) {
		const { day, slot } = (event as CustomEvent<{ day: string; slot: string }>).detail;
		goto(`/?assign=${encodeURIComponent(day)}:${encodeURIComponent(slot)}`);
	}

	function onRemove(event: Event) {
		const { day, slot } = (event as CustomEvent<{ day: string; slot: string }>).detail;
		planner.remove(day as Day, slot as MealSlot);
	}

	function onOpen(event: Event) {
		goto(`/recipe/${(event as CustomEvent<{ id: string }>).detail.id}`);
	}

	function clearAll() {
		if (confirm('Clear the entire week?')) planner.clear();
	}
</script>

<svelte:head>
	<title>Weekly meal planner · Recipe Finder</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Weekly meal planner</h1>
		<p>
			{#if hydrated}
				{planner.plannedCount} of {DAYS.length * MEALS.length} slots filled
			{:else}
				Loading…
			{/if}
		</p>
	</div>
	{#if hydrated && planner.plannedCount > 0}
		<button class="btn btn--danger" type="button" onclick={clearAll}>Clear week</button>
	{/if}
</div>

{#if hydrated}
	<div class="week">
		{#each DAYS as day}
			<section class="day">
				<h2 class="day__name">{day}</h2>
				<div class="day__slots">
					{#each MEALS as meal}
						<!--
							rf-meal-slot receives the assigned recipe as an object property
							and emits assign/remove/open events back to the app.
						-->
						<rf-meal-slot
							{day}
							slotName={meal}
							meal={planner.get(day, meal) ?? null}
							use:listen={{ rfAssign: onAssign, rfRemove: onRemove, rfOpen: onOpen }}
						>
							+ Add {meal.toLowerCase()}
						</rf-meal-slot>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}

<style>
	.week {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.65rem;
		align-items: start;
	}

	.day__name {
		margin: 0 0 0.45rem;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.day__slots {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	@media (max-width: 60rem) {
		.week {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 30rem) {
		.week {
			grid-template-columns: 1fr;
		}
	}
</style>
