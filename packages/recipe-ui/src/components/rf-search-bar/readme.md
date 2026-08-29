# rf-search-bar



<!-- Auto Generated Below -->


## Overview

Search input plus category/area filter selects.

Fully controlled from the host: the app passes the current query and the
available filter options in as properties, and reacts to the emitted events.
The component holds only transient input state.

## Properties

| Property     | Attribute    | Description                                                                  | Type                 | Default |
| ------------ | ------------ | ---------------------------------------------------------------------------- | -------------------- | ------- |
| `area`       | `area`       | Currently selected area, or '' for all.                                      | `string`             | `''`    |
| `areas`      | `areas`      | Selectable areas/cuisines. Accepts an array, or a comma-separated attribute. | `string \| string[]` | `[]`    |
| `categories` | `categories` | Selectable categories. Accepts an array, or a comma-separated attribute.     | `string \| string[]` | `[]`    |
| `category`   | `category`   | Currently selected category, or '' for all.                                  | `string`             | `''`    |
| `value`      | `value`      | Current search term.                                                         | `string`             | `''`    |


## Events

| Event            | Description                                | Type                                               |
| ---------------- | ------------------------------------------ | -------------------------------------------------- |
| `rfFilterChange` | Emitted when either filter select changes. | `CustomEvent<{ category: string; area: string; }>` |
| `rfSearch`       | Emitted when the user submits a search.    | `CustomEvent<{ q: string; }>`                      |


## Slots

| Slot         | Description                                       |
| ------------ | ------------------------------------------------- |
| `"trailing"` | Extra controls rendered beside the search button. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
