# rf-meal-slot



<!-- Auto Generated Below -->


## Overview

One assignable cell of the weekly meal planner, e.g. Monday / Dinner.

Renders the assigned recipe when there is one, and falls back to whatever the
host puts in the default slot when empty — so the app controls the empty-state
copy and the "assign" affordance without the library hard-coding either.

## Properties

| Property   | Attribute   | Description                                                                      | Type               | Default     |
| ---------- | ----------- | -------------------------------------------------------------------------------- | ------------------ | ----------- |
| `day`      | `day`       | Day this slot belongs to, e.g. "Monday".                                         | `string`           | `undefined` |
| `meal`     | `meal`      | The assigned recipe, or null when the slot is free. A JSON attribute also works. | `Recipe \| string` | `null`      |
| `slotName` | `slot-name` | Meal name, e.g. "Dinner". Named `slotName` because `slot` is reserved.           | `string`           | `undefined` |


## Events

| Event      | Description                                      | Type                                          |
| ---------- | ------------------------------------------------ | --------------------------------------------- |
| `rfAssign` | Emitted when the user wants to fill this slot.   | `CustomEvent<{ day: string; slot: string; }>` |
| `rfOpen`   | Emitted when the user opens the assigned recipe. | `CustomEvent<{ id: string; }>`                |
| `rfRemove` | Emitted when the user clears this slot.          | `CustomEvent<{ day: string; slot: string; }>` |


## Slots

| Slot | Description                                         |
| ---- | --------------------------------------------------- |
|      | Content shown when the slot has no recipe assigned. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
