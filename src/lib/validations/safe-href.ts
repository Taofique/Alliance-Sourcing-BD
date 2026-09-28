/**
 * Shared destination policy for every admin-editable link in the CMS: the
 * banner CTA, the footer quick/legal links, the footer attribution and the
 * footer CTA button all accept the exact same two shapes.
 *
 * Limited to same-site absolute paths or HTTPS URLs.
 * Rejected: protocol-relative ("//host"), backslashes, javascript:, data:,
 * credentials in the authority, and any non-HTTPS scheme.
 */
export function isAllowedHref(value: string) {
  if (value.includes("\\")) return false;

  if (value.startsWith("/")) {
    // Exactly one leading slash: "//evil.test" is protocol-relative.
    return !value.startsWith("//");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    url.hostname.length > 0
  );
}

export const HREF_MESSAGE =
  "Use a site path starting with one slash (for example /about) or a full https:// address.";
