import { Component, Prop, h, Host } from '@stencil/core';

/**
 * Placeholder shown when a list has nothing in it.
 *
 * @slot - Optional supporting content below the message, e.g. a call to action.
 */
@Component({
  tag: 'rf-empty-state',
  styleUrl: 'rf-empty-state.css',
  shadow: true,
})
export class RfEmptyState {
  /** Emoji or short glyph shown above the message. */
  @Prop() icon = '🍳';

  /** The headline message. */
  @Prop() message = 'Nothing here yet';

  render() {
    return (
      <Host>
        <div class="empty">
          <div class="empty__icon" aria-hidden="true">
            {this.icon}
          </div>
          <p class="empty__message">{this.message}</p>
          <div class="empty__extra">
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
