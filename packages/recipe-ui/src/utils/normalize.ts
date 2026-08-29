/**
 * Coercion helpers for props that can arrive as either real values or as
 * HTML attributes.
 *
 * Stencil observes an attribute for every `@Prop()`, including ones typed as
 * objects or arrays, and hands the raw attribute string straight to the prop.
 * That happens routinely under server-side rendering: a framework renders
 * `<rf-search-bar categories={[...]}>` to HTML, the array is stringified into
 * an attribute, and the component upgrades with a string where it expected an
 * array. Without coercion the first `render()` throws and Stencil never
 * re-renders that instance — the component stays permanently blank.
 *
 * Tolerating both shapes also makes the components usable from plain HTML.
 */

/** Accept `['a','b']` or the attribute form `"a,b"`. */
export function toStringList(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Accept a real object, or a JSON string attribute.
 *
 * A stringified object that is not JSON (the classic `"[object Object]"` an
 * SSR pass leaves behind) carries no recoverable data, so it becomes `null` —
 * which callers render as an empty/placeholder state rather than crashing on
 * missing fields.
 */
export function toObject<T>(value: T | string | null | undefined): T | null {
  if (value && typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as T;
      } catch {
        return null;
      }
    }
  }
  return null;
}
