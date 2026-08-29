<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { listen } from '$lib/actions/listen';
	import RecipeGrid from '$lib/components/RecipeGrid.svelte';
	import { DAYS, MEALS, type Day, type MealSlot } from '$lib/state/planner.svelte';
	import { userRecipes } from '$lib/state/userRecipes.svelte';
	import type { RecipeSummary } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * The planner links here as `/?assign=Monday:Dinner` when an empty slot is
	 * clicked. Parse it defensively — it comes from the URL, so it can be anything.
	 */
	const assignTarget = $derived.by(() => {
		const raw = page.url.searchParams.get('assign');
		if (!raw) return null;
		const [day, slot] = raw.split(':');
		if (!DAYS.includes(day as Day) || !MEALS.includes(slot as MealSlot)) return null;
		return { day: day as Day, slot: slot as MealSlot };
	});

	const isReplacing = $derived(page.url.searchParams.get('replacing') === '1');

	/**
	 * Navigate by URL rather than local state so searches and filters are
	 * shareable, bookmarkable, and survive a reload.
	 */
	function navigate(next: { q?: string; category?: string; area?: string }) {
		const params = new URLSearchParams();
		const q = next.q ?? data.q;
		const category = next.category ?? data.category;
		const area = next.area ?? data.area;
		if (q) params.set('q', q);
		if (category) params.set('category', category);
		if (area) params.set('area', area);
		// Keep the planner target across searches so the flow isn't lost mid-pick.
		if (assignTarget) {
			params.set('assign', `${assignTarget.day}:${assignTarget.slot}`);
			if (isReplacing) params.set('replacing', '1');
		}
		const qs = params.toString();
		goto(qs ? `/?${qs}` : '/', { keepFocus: true, noScroll: true });
	}

	function onSearch(event: Event) {
		navigate({ q: (event as CustomEvent<{ q: string }>).detail.q });
	}

	function onFilterChange(event: Event) {
		const { category, area } = (event as CustomEvent<{ category: string; area: string }>).detail;
		navigate({ category, area });
	}

	// User-created recipes are client-only, so they're merged in after hydration
	// rather than in `load`.
	const mine = $derived(
		userRecipes.all
			.filter((r) => !data.q || r.title.toLowerCase().includes(data.q.toLowerCase()))
			.filter((r) => !data.category || r.category === data.category)
			.filter((r) => !data.area || r.area === data.area)
			.map(
				(r): RecipeSummary => ({
					id: r.id,
					title: r.title,
					thumbnail: r.thumbnail,
					category: r.category,
					area: r.area,
					userCreated: true
				})
			)
	);

	const all = $derived([...mine, ...data.recipes]);
	const isFiltered = $derived(!!(data.q || data.category || data.area));
</script>

<svelte:head>
	<title>Discover recipes · Recipe Finder</title>
	<meta name="description" content="Search, filter and browse thousands of recipes." />
</svelte:head>

{#if assignTarget}
	<div class="assign-banner">
		<span>
			{isReplacing ? 'Swapping' : 'Choosing'} the recipe for
			<strong>{assignTarget.day} {assignTarget.slot.toLowerCase()}</strong>.
		</span>
		<a class="btn btn--sm" href="/planner">Cancel</a>
	</div>
{/if}

<div class="page-head">
	<div>
		<h1>Discover recipes</h1>
		<p>
			{#if isFiltered}
				{all.length}
				{all.length === 1 ? 'result' : 'results'}
			{:else}
				Browse a selection, or search for something specific.
			{/if}
		</p>
	</div>
	<a class="btn btn--primary" href="/my-recipes/new">+ New recipe</a>
</div>

<!-- Library component: arrays passed as properties, events handled here. -->
<rf-search-bar
	value={data.q}
	category={data.category}
	area={data.area}
	categories={data.categories}
	areas={data.areas}
	use:listen={{ rfSearch: onSearch, rfFilterChange: onFilterChange }}
>
	{#if isFiltered}
		<button slot="trailing" class="btn" type="button" onclick={() => goto('/')}>Clear</button>
	{/if}
</rf-search-bar>

<div style="margin-top:1.5rem">
	<RecipeGrid
		recipes={all}
		{assignTarget}
		{isReplacing}
		emptyIcon="🔍"
		emptyMessage="No recipes match those filters"
	>
		{#snippet emptyChildren()}
			Try a different search term, or clear the filters.
		{/snippet}
	</RecipeGrid>
</div>

<style>
	.assign-banner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 1.25rem;
		padding: 0.65rem 0.9rem;
		font-size: 0.9rem;
		background: color-mix(in srgb, var(--rf-accent) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--rf-accent) 35%, transparent);
		border-radius: 10px;
	}
</style>
