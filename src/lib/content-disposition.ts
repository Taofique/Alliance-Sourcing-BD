/**
 * A `Content-Disposition` value that saves a file under its real name.
 *
 * The name comes out of the database, so it is operator-supplied and is
 * sanitised here rather than trusted: a value carrying a quote, a backslash or
 * a newline would otherwise terminate the header field early and let a stored
 * name inject headers of its own. Non-printable and non-ASCII characters are
 * replaced in the plain form, and the original is carried in the RFC 5987
 * `filename*` field, which is percent-encoded and so cannot break out of
 * anything.
 */
export function attachmentDisposition(fileName: string) {
  const plain =
    fileName
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/["\\]/g, "_")
      .trim()
      .slice(0, 150) || "document.pdf";

  /*
   * `encodeURIComponent` leaves `!`, `'`, `(`, `)` and `*` alone, and RFC 5987
   * does not allow them unencoded in `filename*`. Left as they are, a name like
   * "brochure (final).pdf" produces a parameter a strict reader will not accept.
   */
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${plain}"; filename*=UTF-8''${encoded}`;
}
