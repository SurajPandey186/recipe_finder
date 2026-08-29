# rf-modal



<!-- Auto Generated Below -->


## Overview

A minimal modal dialog whose entire content comes from slots.

The host owns the `open` state; the component only asks to be closed.

## Properties

| Property  | Attribute | Description                                                        | Type      | Default |
| --------- | --------- | ------------------------------------------------------------------ | --------- | ------- |
| `heading` | `heading` | Dialog heading text.                                               | `string`  | `''`    |
| `open`    | `open`    | Whether the dialog is visible. Reflected so CSS can hide the host. | `boolean` | `false` |


## Events

| Event     | Description                                 | Type                |
| --------- | ------------------------------------------- | ------------------- |
| `rfClose` | Emitted when the user dismisses the dialog. | `CustomEvent<void>` |


## Slots

| Slot       | Description                           |
| ---------- | ------------------------------------- |
|            | The dialog body.                      |
| `"footer"` | Action buttons pinned below the body. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
