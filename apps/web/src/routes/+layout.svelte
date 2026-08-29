<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { favorites } from '$lib/state/favorites.svelte';
	import { planner } from '$lib/state/planner.svelte';

	let { children } = $props();

	// The stores read localStorage lazily, which returns the fallback during SSR.
	// Re-read once on the client so the counts reflect real data after hydration.
	onMount(() => {
		favorites.refresh();
		planner.refresh();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="masthead">
	<div class="masthead__inner">
		<a class="brand" href="/">
			<span aria-hidden="true">🍲</span>
			<span>Recipe Finder</span>
		</a>

		<nav class="nav">
			<a href="/">Discover</a>
			<a href="/favorites">
				Favourites
				{#if favorites.count > 0}<span class="badge">{favorites.count}</span>{/if}
			</a>
			<a href="/planner">
				Planner
				{#if planner.plannedCount > 0}<span class="badge">{planner.plannedCount}</span>{/if}
			</a>
			<a href="/my-recipes">My recipes</a>
		</nav>
	</div>
</header>

<main class="shell">
	{@render children()}
</main>
