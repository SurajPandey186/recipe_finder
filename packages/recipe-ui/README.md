# @surajbhushanpandey/recipe-ui

Framework-agnostic web components for recipe discovery and meal-planning UIs, built with
[StencilJS](https://stenciljs.com/). Ships as standard custom elements, so it works in Svelte,
React, Vue, or plain HTML.

Built for the [Recipe Finder & Meal Planner](https://github.com/SurajPandey186/recipe_finder)
application, which consumes this package from npm.

## Install

```bash
npm install @surajbhushanpandey/recipe-ui
```

## Usage

Register every component once, in the browser:

```js
import { defineCustomElements } from '@surajbhushanpandey/recipe-ui';

defineCustomElements();
```

Then use the elements anywhere:

```html
<rf-recipe-card>
  <button slot="actions">Add to plan</button>
</rf-recipe-card>
```

Complex data is passed as **properties**, not attributes:

```js
document.querySelector('rf-recipe-card').recipe = {
  id: '52771',
  title: 'Spicy Arrabiata Penne',
  thumbnail: 'https://…/ustsqw1468250014.jpg',
  category: 'Vegetarian',
  area: 'Italian'
};
```

### SvelteKit

Custom elements can only be defined in the browser. Register them in `src/hooks.client.ts`, which
SvelteKit awaits **before hydration** — this matters, because if the elements are still unregistered
when Svelte sets an object prop, it may fall back to writing an attribute instead:

```ts
import type { ClientInit } from '@sveltejs/kit';

export const init: ClientInit = async () => {
	const { defineCustomElements } = await import('@surajbhushanpandey/recipe-ui');
	defineCustomElements();
};
```

Custom event names can't be expressed with Svelte's `on<name>` syntax, so bind them with a small
action:

```svelte
<rf-recipe-card {recipe} use:listen={{ rfFavoriteToggle: onFav, rfOpen: onOpen }} />
```

## Components

| Element | Key properties | Events | Slots |
| --- | --- | --- | --- |
| `<rf-recipe-card>` | `recipe: Recipe`, `favorite: boolean` | `rfFavoriteToggle`, `rfOpen` | `actions` |
| `<rf-search-bar>` | `value`, `categories: string[]`, `areas: string[]`, `category`, `area` | `rfSearch`, `rfFilterChange` | `trailing` |
| `<rf-meal-slot>` | `day`, `slotName`, `meal: Recipe \| null` | `rfAssign` (`{day, slot, replacing}`), `rfRemove`, `rfOpen` | default (empty-state copy) |
| `<rf-modal>` | `open: boolean`, `heading` | `rfClose` | default, `footer` |
| `<rf-empty-state>` | `icon`, `message` | — | default |

Every event payload is on `event.detail`.

`rfAssign` fires both when filling an empty slot and when swapping the recipe already in one;
`detail.replacing` distinguishes the two.

## Theming

Components use shadow DOM, so page styles don't leak in. Theme them with CSS custom properties set
on any ancestor:

```css
:root {
	--rf-accent: #e2564a;
	--rf-radius: 12px;
	--rf-surface: #ffffff;
	--rf-text: #1c1917;
	--rf-muted: #78716c;
	--rf-border: #e7e5e4;
}
```

## Entry points

| Import | What you get |
| --- | --- |
| `@surajbhushanpandey/recipe-ui` | `dist-custom-elements` build — `defineCustomElements()` plus each component class. Recommended. |
| `@surajbhushanpandey/recipe-ui/loader` | Lazy `dist` loader — `defineCustomElements(window)`. Fallback for bundlers that struggle with the above. |

TypeScript declarations are included.

## Development

```bash
npm install
npm run build     # one-off build
npm start         # watch + dev server
```

## Licence

MIT
