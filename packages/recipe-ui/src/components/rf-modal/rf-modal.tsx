import { Component, Prop, Event, EventEmitter, h, Host, Listen } from '@stencil/core';

/**
 * A minimal modal dialog whose entire content comes from slots.
 *
 * The host owns the `open` state; the component only asks to be closed.
 *
 * @slot - The dialog body.
 * @slot footer - Action buttons pinned below the body.
 */
@Component({
  tag: 'rf-modal',
  styleUrl: 'rf-modal.css',
  shadow: true,
})
export class RfModal {
  /** Whether the dialog is visible. Reflected so CSS can hide the host. */
  @Prop({ reflect: true }) open = false;

  /** Dialog heading text. */
  @Prop() heading = '';

  /** Emitted when the user dismisses the dialog. */
  @Event({ eventName: 'rfClose' }) rfClose: EventEmitter<void>;

  @Listen('keydown', { target: 'document' })
  handleEscape(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape') this.rfClose.emit();
  }

  private close = () => this.rfClose.emit();

  private onBackdrop = (event: MouseEvent) => {
    // Only dismiss when the backdrop itself was clicked, not the dialog inside it.
    if (event.target === event.currentTarget) this.close();
  };

  render() {
    if (!this.open) return null;

    return (
      <Host>
        <div class="backdrop" onClick={this.onBackdrop}>
          <div class="dialog" role="dialog" aria-modal="true" aria-label={this.heading}>
            <header class="dialog__head">
              <h2 class="dialog__title">{this.heading}</h2>
              <button class="dialog__close" type="button" aria-label="Close" onClick={this.close}>
                ×
              </button>
            </header>

            <div class="dialog__body">
              <slot />
            </div>

            <footer class="dialog__foot">
              <slot name="footer" />
            </footer>
          </div>
        </div>
      </Host>
    );
  }
}
