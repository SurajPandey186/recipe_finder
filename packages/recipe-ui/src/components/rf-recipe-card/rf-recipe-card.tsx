import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import type { Recipe } from '../../types';
import { toObject } from '../../utils/normalize';

/**
 * A recipe summary card.
 *
 * Receives the whole recipe as an object property (not a set of string
 * attributes) and emits custom events upward; the host application owns all
 * favourite/navigation state.
 *
 * @slot actions - Extra controls rendered in the card footer, e.g. "Add to plan".
 */
@Component({
  tag: 'rf-recipe-card',
  styleUrl: 'rf-recipe-card.css',
  shadow: true,
})
export class RfRecipeCard {
  /** The recipe to display. Pass as a property; a JSON attribute also works. */
  @Prop() recipe: Recipe | string;

  /** Whether this recipe is currently in the user's favourites. */
  @Prop() favorite = false;

  /** Emitted when the favourite button is pressed. */
  @Event({ eventName: 'rfFavoriteToggle' }) rfFavoriteToggle: EventEmitter<{
    id: string;
    favorite: boolean;
  }>;

  /** Emitted when the user asks to open the full recipe. */
  @Event({ eventName: 'rfOpen' }) rfOpen: EventEmitter<{ id: string }>;

  private get data(): Recipe | null {
    return toObject<Recipe>(this.recipe);
  }

  private handleFavorite = (event: MouseEvent) => {
    event.stopPropagation();
    this.rfFavoriteToggle.emit({ id: this.data?.id, favorite: !this.favorite });
  };

  private handleOpen = () => {
    this.rfOpen.emit({ id: this.data?.id });
  };

  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleOpen();
    }
  };

  render() {
    // Guard against the property not having been set yet: during SSR/hydration
    // the element can exist for a tick before the framework assigns `recipe`.
    const recipe = this.data;
    if (!recipe) {
      return (
        <Host>
          <article class="card card--placeholder" aria-hidden="true"></article>
        </Host>
      );
    }

    const { title, thumbnail, category, area } = recipe;

    return (
      <Host>
        <article class="card">
          <div
            class="card__media"
            role="button"
            tabindex="0"
            aria-label={`View ${title}`}
            onClick={this.handleOpen}
            onKeyDown={this.handleKeydown}
          >
            {thumbnail ? (
              <img src={thumbnail} alt={title} loading="lazy" />
            ) : (
              <div class="card__media-fallback" aria-hidden="true">
                🍽️
              </div>
            )}
            <button
              class={{ card__fav: true, 'card__fav--on': this.favorite }}
              type="button"
              aria-pressed={String(this.favorite)}
              aria-label={this.favorite ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
              onClick={this.handleFavorite}
            >
              {this.favorite ? '♥' : '♡'}
            </button>
          </div>

          <div class="card__body">
            <h3 class="card__title" onClick={this.handleOpen}>
              {title}
            </h3>
            <div class="card__meta">
              {category && <span class="chip">{category}</span>}
              {area && <span class="chip chip--muted">{area}</span>}
            </div>
          </div>

          <footer class="card__footer">
            <slot name="actions" />
          </footer>
        </article>
      </Host>
    );
  }
}
