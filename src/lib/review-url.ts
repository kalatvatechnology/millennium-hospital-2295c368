/** Accepts only https Google review/business links (google.*, g.page, goo.gl). Empty is allowed. */
export function googleReviewUrlError(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/[<>"\s]/.test(v)) return "Paste only the link, starting with https://";
  try {
    const url = new URL(v);
    const host = url.hostname.toLowerCase();
    const google = /(^|\.)google\.[a-z.]+$/.test(host) || host === "g.page" || host.endsWith("goo.gl");
    if (url.protocol !== "https:" || !google) return "Enter a Google review link, e.g. https://g.page/r/.../review";
    return null;
  } catch {
    return "Enter a valid link starting with https://";
  }
}

export function validGoogleReviewUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim() && !googleReviewUrlError(value) ? value.trim() : null;
}
