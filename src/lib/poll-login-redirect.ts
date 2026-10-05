// Only accept local poll detail URLs as destinations after signing in.
export function getPollLoginRedirect(value: unknown): string {
  return typeof value === "string" &&
    /^\/votaciones\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : "/";
}
