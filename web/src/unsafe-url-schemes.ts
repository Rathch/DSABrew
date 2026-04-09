/**
 * URL scheme prefixes that must not be honored for untrusted links (CodeQL js/incomplete-url-scheme-check).
 * Keep in sync everywhere hrefs from user/markdown content are validated.
 */
export const UNSAFE_URL_SCHEME_PREFIXES = ["javascript:", "data:", "vbscript:"] as const;

/** True if the URL uses a disallowed scheme (trim + ASCII lower case, then prefix match). */
export function isUnsafeUrlScheme(url: string): boolean {
  const t = url.trim().toLowerCase();
  return UNSAFE_URL_SCHEME_PREFIXES.some((prefix) => t.startsWith(prefix));
}
