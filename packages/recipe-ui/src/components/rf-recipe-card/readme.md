# rf-recipe-card



<!-- Auto Generated Below -->


## Overview

A recipe summary card.

Receives the whole recipe as an object property (not a set of string
attributes) and emits custom events upward; the host application owns all
favourite/navigation state.

## Properties

| Property   | Attribute  | Description                                                             | Type               | Default     |
| ---------- | ---------- | ----------------------------------------------------------------------- | ------------------ | ----------- |
| `favorite` | `favorite` | Whether this recipe is currently in the user's favourites.              | `boolean`          | `false`     |
| `recipe`   | `recipe`   | The recipe to display. Pass as a property; a JSON attribute also works. | `Recipe \| string` | `undefined` |


## Events

| Event              | Description                                         | Type                                              |
| ------------------ | --------------------------------------------------- | ------------------------------------------------- |
| `rfFavoriteToggle` | Emitted when the favourite button is pressed.       | `CustomEvent<{ id: string; favorite: boolean; }>` |
| `rfOpen`           | Emitted when the user asks to open the full recipe. | `CustomEvent<{ id: string; }>`                    |


## Slots

| Slot        | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| `"actions"` | Extra controls rendered in the card footer, e.g. "Add to plan". |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
