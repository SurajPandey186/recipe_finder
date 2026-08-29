import type { Action } from 'svelte/action';

type Handlers = Record<string, (event: Event) => void>;

/**
 * Attach listeners for custom events emitted by web components.
 *
 * Svelte's `on<name>` attribute syntax can't express Stencil's camelCased custom
 * event names (`onrfFavoriteToggle` would be lowercased by the DOM), so we bind
 * them explicitly instead.
 *
 * Usage:
 *   <rf-recipe-card use:listen={{ rfFavoriteToggle: handleFav }}></rf-recipe-card>
 */
export const listen: Action<HTMLElement, Handlers> = (node, handlers = {}) => {
	let bound: [string, EventListener][] = [];

	const attach = (next: Handlers) => {
		bound = Object.entries(next ?? {}).map(([name, fn]) => {
			const listener = fn as EventListener;
			node.addEventListener(name, listener);
			return [name, listener] as [string, EventListener];
		});
	};

	const detach = () => {
		for (const [name, listener] of bound) node.removeEventListener(name, listener);
		bound = [];
	};

	attach(handlers);

	return {
		update(next: Handlers) {
			detach();
			attach(next);
		},
		destroy: detach
	};
};
