import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalDoctorCard } from "@/components/digital-card/digital-doctor-card";
import { doctorQuery } from "@/lib/queries";
import { buildDigitalCardData } from "@/lib/digital-card/data";
import { DIGITAL_CARD_THEMES, toTheme, type DigitalCardTheme } from "@/lib/digital-card/themes";
import { cn } from "@/lib/utils";

export function DoctorDigitalCardSection({
  slug,
  theme: rawTheme,
  onThemeChange,
  canWrite,
}: {
  slug: string;
  theme: unknown;
  onThemeChange: (theme: DigitalCardTheme) => void;
  canWrite: boolean;
}) {
  const theme = toTheme(rawTheme);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [busy, setBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Always the saved doctor data — the card is never a copy.
  const query = useQuery({ ...doctorQuery(slug, true), enabled: Boolean(slug) });
  const card = useMemo(
    () => (query.data ? buildDigitalCardData(query.data, window.location.origin) : null),
    [query.data],
  );
  const themeName = DIGITAL_CARD_THEMES.find((t) => t.key === theme)?.name;

  const downloadPdf = async () => {
    if (!card) return;
    setBusy(true);
    setPdfError(null);
    try {
      const { downloadDigitalCardPdf } = await import("@/lib/digital-card/pdf");
      await downloadDigitalCardPdf(card, theme);
    } catch {
      setPdfError("The PDF could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading doctor data…</p>;
  if (!card) return <p className="text-sm text-muted-foreground">Save the doctor profile first to build the Digital Card.</p>;

  return (
    <div className="grid gap-6">
      <p className="text-sm leading-6 text-muted-foreground">
        The card reads the saved doctor profile, services, locations and contact details. Only the theme is stored here.
      </p>

      <section className="rounded-md border border-border bg-background p-4 sm:p-5" aria-labelledby="dc-theme">
        <h3 id="dc-theme" className="font-semibold">Digital Card Theme</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {DIGITAL_CARD_THEMES.map((t) => {
            const selected = t.key === theme;
            return (
              <div
                key={t.key}
                className={cn(
                  "flex flex-col overflow-hidden rounded-lg border bg-surface/40",
                  selected ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <div aria-hidden="true" className="pointer-events-none relative h-44 overflow-hidden">
                  <div className="absolute left-1/2 top-2 w-[400px] origin-top -translate-x-1/2 scale-[0.36]">
                    <DigitalDoctorCard card={card} theme={t.key} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 border-t border-border bg-background p-3">
                  <p className="text-sm font-semibold leading-tight">{t.name}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{t.description}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected ? "secondary" : "outline"}
                    className="mt-auto"
                    disabled={!canWrite}
                    aria-pressed={selected}
                    onClick={() => onThemeChange(t.key)}
                  >
                    {selected ? (
                      <>
                        <Check className="size-4" aria-hidden="true" /> Selected
                      </>
                    ) : (
                      `Select ${t.name}`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm">
          Selected theme: <strong>{themeName}</strong>
          <span className="text-muted-foreground"> — click Save below to keep a new choice.</span>
        </p>
      </section>

      <section className="rounded-md border border-border bg-background p-4 sm:p-5" aria-labelledby="dc-preview">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="dc-preview" className="font-semibold">Live Preview</h3>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Preview size">
              <Button type="button" size="sm" variant={device === "desktop" ? "secondary" : "ghost"} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
                <Monitor className="size-4" aria-hidden="true" /> Desktop
              </Button>
              <Button type="button" size="sm" variant={device === "mobile" ? "secondary" : "ghost"} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
                <Smartphone className="size-4" aria-hidden="true" /> Mobile
              </Button>
            </div>
            <Button type="button" size="sm" onClick={downloadPdf} disabled={busy}>
              <Download className="size-4" aria-hidden="true" /> {busy ? "Creating PDF…" : "Download PDF"}
            </Button>
          </div>
        </div>
        {pdfError ? <p className="mt-3 text-sm text-destructive" role="alert">{pdfError}</p> : null}
        <div className="mt-5 rounded-lg bg-surface/60 px-3 py-6 sm:px-6">
          <div className={cn("mx-auto", device === "mobile" ? "max-w-[360px]" : "max-w-[420px]")}>
            <DigitalDoctorCard card={card} theme={theme} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Buttons in the preview are live links.
          {card.actions.reviews ? null : " Google Reviews is hidden because no review link is stored yet."}
        </p>
      </section>
    </div>
  );
}
