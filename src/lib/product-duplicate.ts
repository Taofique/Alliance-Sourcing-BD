/**
 * A Mongo duplicate-key error (11000) reports which index was violated, so the
 * admin is told which field to change instead of a generic failure.
 *
 * Returns null for anything that is not a duplicate, so callers can fall
 * through to their normal error handling.
 */
export function describeProductDuplicate(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) {
    return null;
  }

  const pattern =
    "keyPattern" in error && error.keyPattern && typeof error.keyPattern === "object"
      ? (error.keyPattern as Record<string, unknown>)
      : {};

  if ("categoryId" in pattern && "slug" in pattern) {
    return "This category already has a subcategory with this slug. Choose a different slug.";
  }
  if ("name" in pattern) {
    return "A category with this name already exists.";
  }
  if ("slug" in pattern) {
    return "A category with this slug already exists. Choose a different slug.";
  }
  return "That record already exists.";
}
