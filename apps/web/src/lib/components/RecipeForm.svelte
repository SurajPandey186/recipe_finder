<script lang="ts">
	import { untrack } from 'svelte';
	import {
		validateRecipe,
		toRecipePayload,
		type RecipeErrors,
		type RecipeFormValues
	} from '$lib/state/userRecipes.svelte';
	import type { Recipe } from '$lib/types';

	interface Props {
		/** Existing recipe when editing; omitted when creating. */
		initial?: Recipe;
		submitLabel: string;
		onsubmit: (payload: Omit<Recipe, 'id' | 'userCreated'>) => void;
		oncancel: () => void;
	}

	let { initial, submitLabel, onsubmit, oncancel }: Props = $props();

	/**
	 * Seed the form once. Deliberately a snapshot rather than a `$derived`: the
	 * form owns its values from here on, so later changes to `initial` must not
	 * overwrite what the user is typing.
	 */
	function seed(from: Recipe | undefined): RecipeFormValues {
		return {
			title: from?.title ?? '',
			thumbnail: from?.thumbnail ?? '',
			category: from?.category ?? '',
			area: from?.area ?? '',
			instructions: from?.instructions ?? '',
			ingredients: from?.ingredients?.length
				? from.ingredients.map((i) => ({ ...i }))
				: [{ name: '', measure: '' }]
		};
	}

	let values = $state<RecipeFormValues>(untrack(() => seed(initial)));

	// Errors are only surfaced after a submit attempt, so the form doesn't shout
	// at the user while they're still filling it in.
	let submitted = $state(false);
	const errors = $derived<RecipeErrors>(submitted ? validateRecipe(values) : {});
	const hasErrors = $derived(Object.keys(errors).length > 0);

	function addIngredient() {
		values.ingredients = [...values.ingredients, { name: '', measure: '' }];
	}

	function removeIngredient(index: number) {
		values.ingredients = values.ingredients.filter((_, i) => i !== index);
		if (values.ingredients.length === 0) values.ingredients = [{ name: '', measure: '' }];
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
		if (Object.keys(validateRecipe(values)).length > 0) return;
		onsubmit(toRecipePayload(values));
	}
</script>

<form class="card-surface" onsubmit={handleSubmit} novalidate>
	{#if hasErrors}
		<p class="alert" role="alert">Please fix the highlighted fields before saving.</p>
	{/if}

	<label class="field">
		<span class="field__label">Title *</span>
		<input
			class="field__control"
			class:field__control--invalid={errors.title}
			type="text"
			bind:value={values.title}
			placeholder="Grandma's lemon pasta"
			aria-invalid={!!errors.title}
		/>
		{#if errors.title}<span class="field__error">{errors.title}</span>{/if}
	</label>

	<div class="row">
		<label class="field">
			<span class="field__label">Category</span>
			<input
				class="field__control"
				type="text"
				bind:value={values.category}
				placeholder="Pasta"
			/>
		</label>

		<label class="field">
			<span class="field__label">Cuisine</span>
			<input class="field__control" type="text" bind:value={values.area} placeholder="Italian" />
		</label>
	</div>

	<label class="field" style="margin-top:1rem">
		<span class="field__label">Image URL</span>
		<input
			class="field__control"
			class:field__control--invalid={errors.thumbnail}
			type="url"
			bind:value={values.thumbnail}
			placeholder="https://example.com/photo.jpg"
			aria-invalid={!!errors.thumbnail}
		/>
		{#if errors.thumbnail}
			<span class="field__error">{errors.thumbnail}</span>
		{:else}
			<span class="field__hint">Optional — a placeholder is shown if you leave this blank.</span>
		{/if}
	</label>

	<fieldset class="ingredients-field">
		<legend class="field__label">Ingredients *</legend>

		<div class="stack">
			{#each values.ingredients as ingredient, i (i)}
				<div class="row">
					<input
						class="field__control"
						type="text"
						bind:value={ingredient.name}
						placeholder="Ingredient"
						aria-label={`Ingredient ${i + 1} name`}
					/>
					<input
						class="field__control"
						style="max-width:11rem"
						type="text"
						bind:value={ingredient.measure}
						placeholder="Amount"
						aria-label={`Ingredient ${i + 1} amount`}
					/>
					<button
						class="btn btn--sm"
						type="button"
						aria-label={`Remove ingredient ${i + 1}`}
						onclick={() => removeIngredient(i)}
					>
						×
					</button>
				</div>
			{/each}
		</div>

		{#if errors.ingredients}<span class="field__error">{errors.ingredients}</span>{/if}

		<button class="btn btn--sm" type="button" style="margin-top:.5rem" onclick={addIngredient}>
			+ Add ingredient
		</button>
	</fieldset>

	<label class="field">
		<span class="field__label">Instructions *</span>
		<textarea
			class="field__control"
			class:field__control--invalid={errors.instructions}
			bind:value={values.instructions}
			placeholder="One step per line…"
			aria-invalid={!!errors.instructions}
		></textarea>
		{#if errors.instructions}
			<span class="field__error">{errors.instructions}</span>
		{:else}
			<span class="field__hint">Write one step per line — they'll render as a numbered list.</span>
		{/if}
	</label>

	<div style="display:flex; gap:.5rem; justify-content:flex-end">
		<button class="btn" type="button" onclick={oncancel}>Cancel</button>
		<button class="btn btn--primary" type="submit">{submitLabel}</button>
	</div>
</form>

<style>
	.ingredients-field {
		margin: 0 0 1rem;
		padding: 0;
		border: none;
	}

	.ingredients-field legend {
		padding: 0;
	}
</style>
