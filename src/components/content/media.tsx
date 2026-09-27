import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Headphones, Image as ImageIcon, PlayCircle } from "lucide-react";
import type { MediaItem } from "@/lib/queries";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const typeLabel: Record<MediaItem["media_type"], string> = {
  image: "Image",
  youtube: "Video",
  reel: "Reel",
  podcast: "Podcast",
  article: "Article",
};

/** Official embed URL for platforms that permit embedding; null means open the external link. */
export function mediaEmbedUrl(item: MediaItem): string | null {
  let url: URL;
  try {
    url = new URL(item.url);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      url.searchParams.get("v") ??
      (["shorts", "embed", "live"].includes(parts[0] ?? "") ? parts[1] : undefined);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "instagram.com") {
    const m = url.pathname.match(/^\/(reel|reels|p|tv)\/([^/]+)/);
    return m ? `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed` : null;
  }
  if (host === "facebook.com" || host === "fb.watch")
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(item.url)}&show_text=false`;
  if (host === "open.spotify.com") {
    const m = url.pathname.match(/^\/(episode|show)\/([^/]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

/** Portrait when it is a reel, an Instagram link or a YouTube Short; otherwise landscape. */
export function isVerticalMedia(item: MediaItem): boolean {
  if (item.media_type === "reel") return true;
  try {
    const u = new URL(item.url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    return host === "instagram.com" || (host === "youtube.com" && u.pathname.startsWith("/shorts/"));
  } catch {
    return false;
  }
}

export function mediaPlatform(item: MediaItem): string {
  try {
    const host = new URL(item.url).hostname.replace(/^www\.|^m\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("youtu")) return "YouTube";
    if (host.includes("vimeo")) return "Vimeo";
    if (host.includes("facebook") || host === "fb.watch") return "Facebook";
    if (host.includes("spotify")) return "Spotify";
  } catch {
    /* ignore */
  }
  return typeLabel[item.media_type];
}

function Thumb({ item, vertical }: { item: MediaItem; vertical?: boolean | undefined }) {
  const Icon = item.media_type === "podcast" ? Headphones : item.media_type === "image" ? ImageIcon : PlayCircle;
  return (
    <div
      className={`grid w-full shrink-0 place-items-center overflow-hidden bg-surface ${vertical === true ? "aspect-[3/4]" : vertical === undefined && item.media_type === "reel" ? "aspect-[9/16]" : "aspect-[16/9]"}`}
    >
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt={item.alt_text || item.title} className="size-full object-cover" loading="lazy" />
      ) : (
        <Icon className="size-10 text-muted-foreground" />
      )}
    </div>
  );
}

function Body({ item, compact }: { item: MediaItem; compact?: boolean | undefined }) {
  return (
    <div className="p-4">
      <p className="text-xs font-semibold uppercase text-primary">{compact ? mediaPlatform(item) : typeLabel[item.media_type]}</p>
      {item.title ? <h3 className={`mt-2 font-semibold leading-6 group-hover:underline ${compact ? "line-clamp-2 text-sm" : ""}`}>{item.title}</h3> : null}
      {item.description && !compact ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
    </div>
  );
}

const cardClass =
  "group block w-full border border-border bg-background text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function MediaCard({ item, vertical, compact }: { item: MediaItem; vertical?: boolean | undefined; compact?: boolean | undefined }) {
  const [open, setOpen] = useState(false);
  const isImage = item.media_type === "image";
  const embed = isImage ? null : mediaEmbedUrl(item);
  const imageSrc = isImage ? item.url || item.thumbnail_url : null;
  // Not embeddable: fall back to the external link.
  if (!isImage && !embed)
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className={cardClass}>
        <Thumb item={item} vertical={vertical} />
        <Body item={item} compact={compact} />
      </a>
    );
  const tall = vertical ?? item.media_type === "reel";
  const audio = item.media_type === "podcast";
  return (
    <>
      <button type="button" className={cardClass} onClick={() => setOpen(true)} aria-label={`Open ${item.title}`}>
        <Thumb item={item} vertical={vertical} />
        <Body item={item} compact={compact} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={tall ? "max-w-md" : "max-w-4xl"}>
          <DialogTitle>{item.title}</DialogTitle>
          {item.description ? (
            <DialogDescription>{item.description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{typeLabel[item.media_type]}</DialogDescription>
          )}
          {open ? (
            isImage && imageSrc ? (
              <img src={imageSrc} alt={item.alt_text || item.title} className="max-h-[75vh] w-full object-contain" />
            ) : embed ? (
              <div className={audio ? "h-[232px]" : tall ? "aspect-[9/16] max-h-[75vh]" : "aspect-video"}>
                <iframe
                  src={embed}
                  title={item.title}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : null
          ) : null}
          {!isImage ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline">
              Open on the original site <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const reels = items.filter((item) => item.media_type === "reel");
  const others = items.filter((item) => item.media_type !== "reel");
  return (
    <div className="grid gap-10">
      {others.length ? (
        <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
          {others.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
      {reels.length ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {reels.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Slider({ title, items, vertical }: { title: string; items: MediaItem[]; vertical: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Step by exactly one card (card width + 1rem gap) so the next card slides in smoothly.
  const scroll = (dir: number) => {
    const el = ref.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: "smooth" });
  };
  const btn = "grid size-10 place-items-center border border-border bg-background hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary";
  return (
    <div className="min-w-0">
      <div className="flex items-end justify-between gap-4">
        <h3 className="font-heading text-xl font-semibold">{title}</h3>
        {items.length > 1 ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" className={btn} onClick={() => scroll(-1)} aria-label={`Previous ${title}`}><ChevronLeft className="size-5" /></button>
            <button type="button" className={btn} onClick={() => scroll(1)} aria-label={`Next ${title}`}><ChevronRight className="size-5" /></button>
          </div>
        ) : null}
      </div>
      <div
        ref={ref}
        className="mt-5 flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`shrink-0 snap-start ${vertical ? "w-full sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]" : "w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"}`}
          >
            <MediaCard item={item} vertical={vertical} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Public department media: portrait slider, then landscape slider; empty groups are hidden. */
export function MediaSliders({ items }: { items: MediaItem[] }) {
  const vertical = items.filter(isVerticalMedia);
  const horizontal = items.filter((item) => !isVerticalMedia(item));
  return (
    <div className="grid gap-12">
      {vertical.length ? <Slider title="Short videos" items={vertical} vertical /> : null}
      {horizontal.length ? <Slider title="Videos" items={horizontal} vertical={false} /> : null}
    </div>
  );
}
