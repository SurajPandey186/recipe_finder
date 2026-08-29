# Recipe Finder & Meal Planner

A recipe discovery and weekly meal-planning application built with **Svelte 5 / SvelteKit**, using a
custom **StencilJS** web component library that is published to npm and consumed from there.

- **Live app:** https://web-ten-tau-66.vercel.app
- **npm package:** [`@surajbhushanpandey/recipe-ui`](https://www.npmjs.com/package/@surajbhushanpandey/recipe-ui) (v1.1.0)
- **Repository:** https://github.com/SurajPandey186/recipe_finder

## Features

**Recipe discovery** — search by name, filter by category and cuisine, browse a curated default
selection. Search state lives in the URL, so results are shareable and survive a reload.

**Recipe details** — full ingredient list with measures, and instructions split into numbered steps.

**Recipe management** — create, edit and delete your own recipes, with client-side validation that
blocks saving and shows per-field errors. Your recipes appear in search alongside API results.

**Favourites** — save any recipe (API or your own) and view them all in one place.

**Weekly meal planner** — a 7 × 3 grid of day/meal slots. Assign recipes from anywhere in the app,
or click an empty slot to go pick one and have it drop straight into place. Filled slots can be
swapped in place (⇄) or cleared (×).

## Repository layout

```
recepie_finder/
├── packages/recipe-ui/   # StencilJS component library → published to npm
├── apps/web/             # SvelteKit application      → deployed to Vercel
└── docs/                 # assignment brief
```

The two packages are deliberately **not** an npm workspace. The assignment requires the app to
consume the *published* package, and a workspace would silently shadow the registry version with the
local source — making it impossible to tell whether the published artifact actually works.

## Setup

Requires Node 20+ (developed on Node 24).

```bash
git clone https://github.com/SurajPandey186/recipe_finder.git
cd recepie_finder
```

### Component library

```bash
cd packages/recipe-ui
npm install
npm run build
```

### Application

```bash
cd apps/web
npm install
```

## Starting the development server

```bash
cd apps/web
npm run dev
```

The app runs at **http://localhost:5173**.

Other useful commands, all from `apps/web`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check with `svelte-check` |
| `npm run test:e2e` | Run the end-to-end browser tests (see [Testing](#testing)) |

To work on the library and app together, run `npm start` in `packages/recipe-ui` (watch mode) and
re-install the packed tarball in the app, or temporarily point the dependency at the local folder.

## Architecture

### Why the components are consumed from npm

`apps/web/package.json` depends on `@surajbhushanpandey/recipe-ui` by **semver range**, not by a
`file:` or `link:` path. The app imports the built artifact exactly as any third-party consumer
would, which is what the assignment asks for and what makes the published package meaningful.

### The SvelteKit ↔ Stencil seam

Three details make this work, and each one is a real trap:

1. **Registration happens before hydration.** The elements are defined in
   `apps/web/src/hooks.client.ts`, which SvelteKit awaits before mounting the app. If the elements
   were still unregistered when Svelte set `<rf-recipe-card recipe={…}>`, Svelte would fall back to a
   heuristic and could write a stringified attribute (`recipe="[object Object]"`) instead of the
   property — leaving every card blank.
2. **Complex data is passed as properties.** Recipes and filter option lists cross the boundary as
   real objects and arrays, not serialised attributes.
3. **Custom events are bound explicitly.** Svelte's `on<name>` syntax can't express Stencil's
   camelCased event names, so `apps/web/src/lib/actions/listen.ts` provides a small action:
   `use:listen={{ rfFavoriteToggle: handler }}`.

Slots are used throughout — the "Add to plan" button is projected into the card's `actions` slot, and
`<rf-modal>` renders entirely from slotted content.

### State

Favourites, user-created recipes and the meal plan are held in Svelte 5 runes and mirrored into
`localStorage` (`apps/web/src/lib/state/`). There is no backend; the assignment doesn't call for one.

User-created recipes get ids prefixed `user-`, so they can never collide with TheMealDB's numeric
ids. The details route reads that prefix to decide whether to call the API or the local store.

### The recipe API

Data comes from [TheMealDB](https://www.themealdb.com/api.php) (free, no API key, no rate limit).
Two quirks are handled in `apps/web/src/lib/api/mealdb.ts`:

- `filter.php` returns **partial** records — id, title and thumbnail only — while `search.php`
  returns full ones. Anything needing full data does a follow-up `lookup.php`.
- There is **no combined search + filter endpoint**. When a search term and a filter are both
  present, the app searches by name and intersects on category/cuisine client-side; when only
  filters are present it uses `filter.php` directly.

Empty results arrive as `{"meals": null}` rather than an empty array, which is normalised in one
place.

## Assumptions made

- **No authentication or backend.** The brief describes a client-side application, so favourites,
  user recipes and the meal plan are per-browser via `localStorage`. Clearing site data clears them.
- **TheMealDB over Spoonacular/Edamam.** It needs no API key and has no request quota, so the
  deployed app cannot break for a reviewer because a free tier ran out.
- **"Filter recipes" means category and cuisine**, the two dimensions TheMealDB actually supports as
  filters.
- **A week is Monday–Sunday with breakfast, lunch and dinner** — the brief doesn't specify the shape
  of the plan.
- **Editing and deleting is limited to user-created recipes**, as the brief specifies. API recipes
  are read-only; they can still be favourited and planned.
- **The planner stores a snapshot** of the recipe (title and thumbnail) rather than just an id, so
  the planner grid renders without a network request per slot.
- **Local `npm run build` uses `adapter-auto`.** `adapter-vercel` writes symlinks, which Windows
  blocks unless Developer Mode is on. Vercel sets `VERCEL=1` in its build environment and gets the
  real adapter — see `apps/web/vite.config.ts`.

## Deployment

Deployed to Vercel with `@sveltejs/adapter-vercel`, from the `apps/web` directory:

```bash
cd apps/web
npx vercel deploy --prod
```

The Vercel project is connected to this repository with its **Root Directory** set to
`apps/web`, so every push to `main` triggers a production deployment automatically — the
command above is only needed for a manual out-of-band deploy.

The live URL is **https://web-ten-tau-66.vercel.app**.

Note that Vercel also generates two account-scoped aliases
(`web-suraj-bhushan-pandeys-projects.vercel.app` and the per-deployment URL). Those sit behind
Vercel's deployment protection and redirect to an SSO login, so they are not usable by anyone
outside the account — the public URL above is the one to use.

## Testing

The SvelteKit ↔ Stencil boundary is the part of this project most likely to break silently, so it is
covered by an end-to-end Playwright run against a real browser (`apps/web/e2e/run.mjs`).

```bash
cd apps/web
npx playwright install chromium   # one-off: fetch the browser binary
npm run dev                       # in one terminal
npm run test:e2e                  # in another
```

It can be pointed at any deployment, which is how the live site is verified:

```bash
BASE=https://web-ten-tau-66.vercel.app npm run test:e2e
```

40 checks, currently all passing against production. It asserts the things that actually matter for
the integration rather than just that pages return 200:

- object and array props arrive as **properties**, not stringified attributes
- each custom event (`rfSearch`, `rfFilterChange`, `rfFavoriteToggle`, `rfOpen`, `rfAssign`,
  `rfRemove`, `rfClose`) is received and acted on
- slotted content is projected into the components
- favourites and planner entries survive a hard reload
- invalid form submission is blocked and saves nothing
- the browser console is free of errors

This caught a real defect before release: under SSR, Svelte serialises array props into HTML
attributes, and Stencil observes an attribute for every `@Prop` — so `rf-search-bar` received
`categories` as the string `"Beef,Breakfast,…"`, threw inside `render()`, and never rendered again.
The fix (`packages/recipe-ui/src/utils/normalize.ts`, released as `1.0.1`) makes the components
coerce attribute-serialised input, which also makes them usable from plain HTML.

## Licence

MIT
