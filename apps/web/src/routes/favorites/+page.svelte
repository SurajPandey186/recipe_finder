<script lang="ts">
	import { onMount } from 'svelte';
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import { favorites } from '$lib/state/favorites.svelte';

	// Favourites live in localStorage, so there is nothing meaningful to render
	// on the server. Wait for hydration before deciding the list is empty.
	let hydrated = $state(false);
	onMount(() => {
		favorites.refresh();
		hydrated = true;
	});
</script>

<svelte:head>
	<title>Favourites · Recipe Finder</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Favourites</h1>
		<p>
			{#if hydrated}
				{favorites.count}
				{favorites.count === 1 ? 'recipe' : 'recipes'} saved
			{:else}
				Loading…
			{/if}
		</p>
	</div>
	{#if hydrated && favorites.count > 0}
		<a class="btn" href="/">+ Find more</a>
	{/if}
</div>

{#if hydrated}
	<RecipeGrid
		recipes={favorites.all}
		emptyIcon="♡"
		emptyMessage="No favourites yet"
	>
		{#snippet emptyChildren()}
			Tap the heart on any recipe to save it here.
		{/snippet}
	</RecipeGrid>
{/if}
