/** Works on localhost/HTTPS and ordinary HTTP previews without requiring randomUUID. */
export function createId(prefix = "character"): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`;
}
