<script lang="ts">
	import { onMount } from 'svelte';
	import AddToPlanModal from '$lib/components/AddToPlanModal.svelte';
	import { favorites } from '$lib/state/favorites.svelte';
	import { userRecipes } from '$lib/state/userRecipes.svelte';
	import type { Recipe, RecipeSummary } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let hydrated = $state(false);
	onMount(() => {
		userRecipes.refresh();
		favorites.refresh();
		hydrated = true;
	});

	// API recipes arrive from `load`; user recipes are resolved from the store
	// once localStorage is readable.
	const recipe = $derived<Recipe | undefined>(
		data.userCreated ? userRecipes.get(data.id) : (data.recipe ?? undefined)
	);

	const summary = $derived<RecipeSummary | null>(
		recipe
			? {
					id: recipe.id,
					title: recipe.title,
					thumbnail: recipe.thumbnail,
					category: recipe.category,
					area: recipe.area,
					userCreated: recipe.userCreated
				}
			: null
	);

	let planning = $state<RecipeSummary | null>(null);

	// TheMealDB stores instructions as one blob with newlines; split into steps.
	const steps = $derived(
		(recipe?.instructions ?? '')
			.split(/\r?\n+/)
			.map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
			.filter(Boolean)
	);
</script>

<svelte:head>
	<title>{recipe?.title ?? 'Recipe'} · Recipe Finder</title>
</svelte:head>

{#if !recipe}
	{#if data.userCreated && !hydrated}
		<p style="padding:3rem 0; color:var(--rf-muted)">Loading recipe…</p>
	{:else}
		<rf-empty-state icon="🤷" message="That recipe doesn't exist">
			It may have been deleted.
		</rf-empty-state>
		<p><a class="btn" href="/">← Back to discover</a></p>
	{/if}
{:else}
	<p style="margin:1.5rem 0 0"><a class="btn btn--sm" href="/">← Back</a></p>

	<article class="detail">
		<div class="detail__media">
			{#if recipe.thumbnail}
				<img src={recipe.thumbnail} alt={recipe.title} />
			{:else}
				<div class="detail__placeholder" aria-hidden="true">🍽️</div>
			{/if}
		</div>

		<div class="detail__intro">
			<h1>{recipe.title}</h1>

			<div class="detail__meta">
				{#if recipe.category}<span class="tag">{recipe.category}</span>{/if}
				{#if recipe.area}<span class="tag tag--muted">{recipe.area}</span>{/if}
				{#if recipe.userCreated}<span class="tag tag--mine">Your recipe</span>{/if}
				{#each recipe.tags ?? [] as tag}<span class="tag tag--muted">{tag}</span>{/each}
			</div>

			<div class="detail__actions">
				<button
					class="btn"
					class:btn--primary={favorites.has(recipe.id)}
					type="button"
					onclick={() => summary && favorites.toggle(summary)}
				>
					{favorites.has(recipe.id) ? '♥ Favourited' : '♡ Add to favourites'}
				</button>

				<button class="btn" type="button" onclick={() => (planning = summary)}>
					+ Add to plan
				</button>

				{#if recipe.userCreated}
					<a class="btn" href="/my-recipes/{recipe.id}/edit">Edit</a>
				{/if}

				{#if recipe.source}
					<a class="btn" href={recipe.source} target="_blank" rel="noreferrer noopener">Source ↗</a>
				{/if}
			</div>
		</div>

		<section class="detail__ingredients">
			<h2>Ingredients</h2>
			{#if recipe.ingredients?.length}
				<ul class="ingredients">
					{#each recipe.ingredients as item}
						<li>
							<span class="ingredients__name">{item.name}</span>
							{#if item.measure}<span class="ingredients__measure">{item.measure}</span>{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted">No ingredients listed.</p>
			{/if}
		</section>

		<section class="detail__instructions">
			<h2>Instructions</h2>
			{#if steps.length}
				<ol class="steps">
					{#each steps as step}
						<li>{step}</li>
					{/each}
				</ol>
			{:else}
				<p class="muted">No instructions provided.</p>
			{/if}
		</section>
	</article>
{/if}

<AddToPlanModal recipe={planning} onclose={() => (planning = null)} />

<style>
	.detail {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
		gap: 1.5rem 2rem;
		margin-top: 1rem;
	}

	.detail__media {
		grid-row: span 2;
	}

	.detail__media img,
	.detail__placeholder {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: var(--rf-radius);
	}

	.detail__placeholder {
		display: grid;
		place-items: center;
		font-size: 3rem;
		background: var(--rf-border);
	}

	.detail__intro h1 {
		margin: 0 0 0.6rem;
		font-size: 1.9rem;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.detail__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}

	.tag {
		padding: 0.2rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--rf-accent);
		background: color-mix(in srgb, var(--rf-accent) 12%, transparent);
		border-radius: 999px;
	}

	.tag--muted {
		color: var(--rf-muted);
		background: color-mix(in srgb, var(--rf-muted) 12%, transparent);
	}

	.tag--mine {
		color: #047857;
		background: #d1fae5;
	}

	.detail__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.detail__ingredients {
		grid-column: 2;
	}

	.detail__instructions {
		grid-column: 1 / -1;
	}

	h2 {
		margin: 0 0 0.7rem;
		font-size: 1.05rem;
	}

	.ingredients {
		margin: 0;
		padding: 0;
		list-style: none;
		columns: 2;
		column-gap: 1.5rem;
	}

	.ingredients li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		break-inside: avoid;
		padding: 0.35rem 0;
		font-size: 0.9rem;
		border-bottom: 1px solid var(--rf-border);
	}

	.ingredients__measure {
		flex-shrink: 0;
		color: var(--rf-muted);
	}

	.steps {
		margin: 0;
		padding-left: 1.2rem;
		max-width: 62ch;
	}

	.steps li {
		margin-bottom: 0.7rem;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.muted {
		color: var(--rf-muted);
		font-size: 0.9rem;
	}

	@media (max-width: 48rem) {
		.detail {
			grid-template-columns: 1fr;
		}
		.detail__media {
			grid-row: auto;
			max-width: 22rem;
		}
		.detail__ingredients,
		.detail__instructions {
			grid-column: 1;
		}
		.ingredients {
			columns: 1;
		}
	}
</style>
