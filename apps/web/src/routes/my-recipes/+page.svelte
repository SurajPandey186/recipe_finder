<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { listen } from '$lib/actions/listen';
	import AddToPlanModal from '$lib/components/AddToPlanModal.svelte';
	import { favorites } from '$lib/state/favorites.svelte';
	import { userRecipes } from '$lib/state/userRecipes.svelte';
	import type { RecipeSummary } from '$lib/types';

	let hydrated = $state(false);
	onMount(() => {
		userRecipes.refresh();
		favorites.refresh();
		hydrated = true;
	});

	let planning = $state<RecipeSummary | null>(null);
	let pendingDelete = $state<RecipeSummary | null>(null);

	const summaries = $derived(
		userRecipes.all.map(
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

	function onOpen(event: Event) {
		goto(`/recipe/${(event as CustomEvent<{ id: string }>).detail.id}`);
	}

	function confirmDelete() {
		if (!pendingDelete) return;
		userRecipes.remove(pendingDelete.id);
		// Keep favourites consistent — a deleted recipe shouldn't linger there.
		favorites.remove(pendingDelete.id);
		pendingDelete = null;
	}
</script>

<svelte:head>
	<title>My recipes · Recipe Finder</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>My recipes</h1>
		<p>
			{#if hydrated}
				{userRecipes.count}
				{userRecipes.count === 1 ? 'recipe' : 'recipes'} you created
			{:else}
				Loading…
			{/if}
		</p>
	</div>
	<a class="btn btn--primary" href="/my-recipes/new">+ New recipe</a>
</div>

{#if hydrated}
	{#if summaries.length === 0}
		<rf-empty-state icon="📝" message="You haven't created any recipes yet">
			Add your own recipes and they'll show up in search alongside the rest.
		</rf-empty-state>
	{:else}
		<div class="grid">
			{#each summaries as recipe (recipe.id)}
				<rf-recipe-card
					{recipe}
					favorite={favorites.has(recipe.id)}
					use:listen={{ rfFavoriteToggle: () => favorites.toggle(recipe), rfOpen: onOpen }}
				>
					<div slot="actions" class="actions">
						<a class="btn btn--sm" href="/my-recipes/{recipe.id}/edit">Edit</a>
						<button class="btn btn--sm" type="button" onclick={() => (planning = recipe)}>
							Plan
						</button>
						<button
							class="btn btn--sm btn--danger"
							type="button"
							onclick={() => (pendingDelete = recipe)}
						>
							Delete
						</button>
					</div>
				</rf-recipe-card>
			{/each}
		</div>
	{/if}
{/if}

<AddToPlanModal recipe={planning} onclose={() => (planning = null)} />

<!-- Deletion is destructive, so it goes through a confirmation dialog. -->
<rf-modal
	open={!!pendingDelete}
	heading="Delete recipe?"
	use:listen={{ rfClose: () => (pendingDelete = null) }}
>
	<p style="margin:0">
		<strong>{pendingDelete?.title}</strong> will be permanently removed, along with any planner
		entries you create from it. This can't be undone.
	</p>

	<div slot="footer" style="display:flex; gap:.5rem; justify-content:flex-end">
		<button class="btn" type="button" onclick={() => (pendingDelete = null)}>Cancel</button>
		<button class="btn btn--danger" type="button" onclick={confirmDelete}>Delete</button>
	</div>
</rf-modal>

<style>
	.actions {
		display: flex;
		gap: 0.35rem;
	}

	.actions :global(.btn) {
		flex: 1;
		justify-content: center;
	}
</style>
