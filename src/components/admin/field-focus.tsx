import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SEO_FIX_FIELD_LABELS, type SeoFixField } from "@/lib/seo/fix-links";

const HIGHLIGHT = ["ring-2", "ring-primary", "ring-offset-4", "ring-offset-background", "rounded-md"];

/**
 * Opened from "Fix issue →": scrolls the requested field into view and briefly highlights it.
 * Reads ?field=… and matches the editor's own visible label, so no editor needs rewiring.
 */
export function FieldFocus() {
  const location = useRouterState({ select: (s) => s.location });
  const field = (location.search as Record<string, unknown>)["field"];
  useEffect(() => {
    if (typeof field !== "string" || !(field in SEO_FIX_FIELD_LABELS)) return;
    const candidates = SEO_FIX_FIELD_LABELS[field as SeoFixField].map((c) => c.toLowerCase());
    let tries = 0;
    let clear: number | undefined;
    const timer = window.setInterval(() => {
      tries += 1;
      const labels = [...document.querySelectorAll<HTMLElement>("main label")];
      let match: HTMLElement | undefined;
      for (const candidate of candidates) {
        match = labels.find((l) => (l.textContent ?? "").trim().toLowerCase().startsWith(candidate));
        if (match) break;
      }
      if (!match && tries < 30) return;
      window.clearInterval(timer);
      if (!match) return;
      const block = (match.parentElement?.parentElement ?? match) as HTMLElement;
      block.scrollIntoView({ behavior: "smooth", block: "center" });
      const htmlFor = match.getAttribute("for");
      const control = htmlFor ? document.getElementById(htmlFor) : null;
      control?.focus({ preventScroll: true });
      block.classList.add(...HIGHLIGHT);
      clear = window.setTimeout(() => block.classList.remove(...HIGHLIGHT), 2500);
    }, 150);
    return () => {
      window.clearInterval(timer);
      if (clear) window.clearTimeout(clear);
    };
  }, [field, location.pathname]);
  return null;
}
