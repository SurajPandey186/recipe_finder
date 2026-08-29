import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import type { Recipe } from '../../types';
import { toObject } from '../../utils/normalize';

/**
 * One assignable cell of the weekly meal planner, e.g. Monday / Dinner.
 *
 * Renders the assigned recipe when there is one, and falls back to whatever the
 * host puts in the default slot when empty — so the app controls the empty-state
 * copy and the "assign" affordance without the library hard-coding either.
 *
 * @slot - Content shown when the slot has no recipe assigned.
 */
@Component({
  tag: 'rf-meal-slot',
  styleUrl: 'rf-meal-slot.css',
  shadow: true,
})
export class RfMealSlot {
  /** Day this slot belongs to, e.g. "Monday". */
  @Prop() day: string;

  /** Meal name, e.g. "Dinner". Named `slotName` because `slot` is reserved. */
  @Prop() slotName: string;

  /** The assigned recipe, or null when the slot is free. A JSON attribute also works. */
  @Prop() meal: Partial<Recipe> | string | null = null;

  /** Emitted when the user wants to fill this slot. */
  @Event({ eventName: 'rfAssign' }) rfAssign: EventEmitter<{ day: string; slot: string }>;

  /** Emitted when the user clears this slot. */
  @Event({ eventName: 'rfRemove' }) rfRemove: EventEmitter<{ day: string; slot: string }>;

  /** Emitted when the user opens the assigned recipe. */
  @Event({ eventName: 'rfOpen' }) rfOpen: EventEmitter<{ id: string }>;

  private assign = () => this.rfAssign.emit({ day: this.day, slot: this.slotName });
  private remove = () => this.rfRemove.emit({ day: this.day, slot: this.slotName });
  private get data(): Partial<Recipe> | null {
    return toObject<Partial<Recipe>>(this.meal);
  }

  private open = () => this.data?.id && this.rfOpen.emit({ id: this.data.id });

  render() {
    const meal = this.data;
    const filled = !!meal;

    return (
      <Host>
        <div class={{ slot: true, 'slot--filled': filled }}>
          <span class="slot__label">{this.slotName}</span>

          {filled ? (
            <div class="slot__meal">
              {meal.thumbnail && (
                <img class="slot__thumb" src={meal.thumbnail} alt="" loading="lazy" />
              )}
              <button class="slot__title" type="button" onClick={this.open}>
                {meal.title}
              </button>
              <button
                class="slot__remove"
                type="button"
                aria-label={`Remove ${meal.title} from ${this.day} ${this.slotName}`}
                onClick={this.remove}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              class="slot__empty"
              type="button"
              aria-label={`Add a recipe to ${this.day} ${this.slotName}`}
              onClick={this.assign}
            >
              <slot>+ Add</slot>
            </button>
          )}
        </div>
      </Host>
    );
  }
}
