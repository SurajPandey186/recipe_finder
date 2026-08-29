import { Component, Prop, State, Event, EventEmitter, h, Host, Watch } from '@stencil/core';
import { toStringList } from '../../utils/normalize';

/**
 * Search input plus category/area filter selects.
 *
 * Fully controlled from the host: the app passes the current query and the
 * available filter options in as properties, and reacts to the emitted events.
 * The component holds only transient input state.
 *
 * @slot trailing - Extra controls rendered beside the search button.
 */
@Component({
  tag: 'rf-search-bar',
  styleUrl: 'rf-search-bar.css',
  shadow: true,
})
export class RfSearchBar {
  /** Current search term. */
  @Prop() value = '';

  /** Selectable categories. Accepts an array, or a comma-separated attribute. */
  @Prop() categories: string[] | string = [];

  /** Selectable areas/cuisines. Accepts an array, or a comma-separated attribute. */
  @Prop() areas: string[] | string = [];

  /** Currently selected category, or '' for all. */
  @Prop() category = '';

  /** Currently selected area, or '' for all. */
  @Prop() area = '';

  @State() draft = '';

  /** Emitted when the user submits a search. */
  @Event({ eventName: 'rfSearch' }) rfSearch: EventEmitter<{ q: string }>;

  /** Emitted when either filter select changes. */
  @Event({ eventName: 'rfFilterChange' }) rfFilterChange: EventEmitter<{
    category: string;
    area: string;
  }>;

  componentWillLoad() {
    this.draft = this.value;
  }

  @Watch('value')
  syncDraft(next: string) {
    this.draft = next ?? '';
  }

  private submit = (event: Event) => {
    event.preventDefault();
    this.rfSearch.emit({ q: this.draft.trim() });
  };

  private onInput = (event: Event) => {
    this.draft = (event.target as HTMLInputElement).value;
  };

  private onCategory = (event: Event) => {
    const category = (event.target as HTMLSelectElement).value;
    this.rfFilterChange.emit({ category, area: this.area });
  };

  private onArea = (event: Event) => {
    const area = (event.target as HTMLSelectElement).value;
    this.rfFilterChange.emit({ category: this.category, area });
  };

  render() {
    // Coerced at render time: under SSR these can arrive as attribute strings.
    const categories = toStringList(this.categories);
    const areas = toStringList(this.areas);

    return (
      <Host>
        <form class="bar" onSubmit={this.submit} role="search">
          <div class="bar__field">
            <span class="bar__icon" aria-hidden="true">
              🔎
            </span>
            <input
              type="search"
              class="bar__input"
              placeholder="Search recipes by name…"
              aria-label="Search recipes by name"
              value={this.draft}
              onInput={this.onInput}
            />
          </div>

          <select class="bar__select" aria-label="Filter by category" onChange={this.onCategory}>
            <option value="" selected={this.category === ''}>
              All categories
            </option>
            {categories.map((c) => (
              <option value={c} selected={c === this.category}>
                {c}
              </option>
            ))}
          </select>

          <select class="bar__select" aria-label="Filter by cuisine" onChange={this.onArea}>
            <option value="" selected={this.area === ''}>
              All cuisines
            </option>
            {areas.map((a) => (
              <option value={a} selected={a === this.area}>
                {a}
              </option>
            ))}
          </select>

          <button class="bar__submit" type="submit">
            Search
          </button>

          <slot name="trailing" />
        </form>
      </Host>
    );
  }
}
