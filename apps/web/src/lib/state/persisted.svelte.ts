import { browser } from '$app/environment';

/**
 * A `$state` value that mirrors itself into localStorage.
 *
 * Reads are synchronous and safe on the server (they just return the fallback),
 * so components can use these stores without a `browser` guard at every call
 * site. Writes only happen in the browser.
 */
export function persisted<T>(key: string, fallback: T) {
	let value = $state<T>(load());

	function load(): T {
		if (!browser) return fallback;
		try {
			const raw = localStorage.getItem(key);
			return raw === null ? fallback : (JSON.parse(raw) as T);
		} catch {
			// Corrupt or unparseable entry — fall back rather than crash the app.
			return fallback;
		}
	}

	function save(next: T) {
		if (!browser) return;
		try {
			localStorage.setItem(key, JSON.stringify(next));
		} catch {
			// Quota exceeded or storage disabled; state still works in-memory.
		}
	}

	return {
		get current() {
			return value;
		},
		set current(next: T) {
			value = next;
			save(next);
		},
		/** Re-read from storage — used once on mount to hydrate after SSR. */
		refresh() {
			value = load();
		}
	};
}
