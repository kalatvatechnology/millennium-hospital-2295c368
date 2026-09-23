/** Accepts only https Google Maps embed URLs; never raw iframe HTML. */
export function mapEmbedUrlError(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/<\s*iframe|</i.test(v)) return "Paste only the embed URL (the src value), not the iframe code.";
  let url: URL;
  try { url = new URL(v); } catch { return "Map Embed URL is not a valid web address."; }
  if (url.protocol !== "https:") return "Map Embed URL must start with https://.";
  if (!isGoogleMapsEmbedUrl(v)) return "Use a Google Maps embed URL, e.g. https://www.google.com/maps/embed?pb=...";
  return null;
}

export function isGoogleMapsEmbedUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const google = host === "google.com" || host.endsWith(".google.com") || /^(www\.|maps\.)?google\.[a-z.]+$/.test(host);
    return url.protocol === "https:" && google && url.pathname.startsWith("/maps/embed");
  } catch { return false; }
}
