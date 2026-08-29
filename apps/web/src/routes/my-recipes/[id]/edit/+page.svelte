<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import { userRecipes } from '$lib/state/userRecipes.svelte';
	import type { Recipe } from '$lib/types';

	// User recipes live in localStorage, so the record can only be read after
	// hydration — hence the loading gate rather than a `load` function.
	let hydrated = $state(false);
	onMount(() => {
		userRecipes.refresh();
		hydrated = true;
	});

	const id = $derived(page.params.id ?? '');
	const recipe = $derived(hydrated ? userRecipes.get(id) : undefined);

	function save(payload: Omit<Recipe, 'id' | 'userCreated'>) {
		userRecipes.update(id, payload);
		goto(`/recipe/${id}`);
	}
</script>

<svelte:head>
	<title>Edit {recipe?.title ?? 'recipe'} · Recipe Finder</title>
</svelte:head>

{#if !hydrated}
	<p style="padding:3rem 0; color:var(--rf-muted)">Loading recipe…</p>
{:else if !recipe}
	<rf-empty-state icon="🤷" message="That recipe doesn't exist">
		It may have already been deleted.
	</rf-empty-state>
	<p><a class="btn" href="/my-recipes">← Back to my recipes</a></p>
{:else}
	<div class="page-head">
		<div>
			<h1>Edit recipe</h1>
			<p>Editing <strong>{recipe.title}</strong>.</p>
		</div>
	</div>

	<RecipeForm
		initial={recipe}
		submitLabel="Save changes"
		onsubmit={save}
		oncancel={() => goto(`/recipe/${id}`)}
	/>
{/if}
