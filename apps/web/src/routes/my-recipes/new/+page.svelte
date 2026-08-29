<script lang="ts">
	import { goto } from '$app/navigation';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import { userRecipes } from '$lib/state/userRecipes.svelte';
	import type { Recipe } from '$lib/types';

	function save(payload: Omit<Recipe, 'id' | 'userCreated'>) {
		const created = userRecipes.create(payload);
		goto(`/recipe/${created.id}`);
	}
</script>

<svelte:head>
	<title>New recipe · Recipe Finder</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>New recipe</h1>
		<p>Fields marked * are required.</p>
	</div>
</div>

<RecipeForm submitLabel="Create recipe" onsubmit={save} oncancel={() => goto('/my-recipes')} />
