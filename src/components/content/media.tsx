import { useState } from "react";
import { ExternalLink, Headphones, Image as ImageIcon, PlayCircle } from "lucide-react";
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

function Thumb({ item }: { item: MediaItem }) {
  const Icon = item.media_type === "podcast" ? Headphones : item.media_type === "image" ? ImageIcon : PlayCircle;
  return (
    <div
      className={`grid place-items-center overflow-hidden bg-surface ${item.media_type === "reel" ? "aspect-[9/16]" : "aspect-video"}`}
    >
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt={item.alt_text || item.title} className="size-full object-cover" loading="lazy" />
      ) : (
        <Icon className="size-10 text-muted-foreground" />
      )}
    </div>
  );
}

function Body({ item }: { item: MediaItem }) {
  return (
    <div className="p-4">
      <p className="text-xs font-semibold uppercase text-primary">{typeLabel[item.media_type]}</p>
      <h3 className="mt-2 font-semibold leading-6 group-hover:underline">{item.title}</h3>
      {item.description ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
    </div>
  );
}

const cardClass =
  "group block w-full border border-border bg-background text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function MediaCard({ item }: { item: MediaItem }) {
  const [open, setOpen] = useState(false);
  const isImage = item.media_type === "image";
  const embed = isImage ? null : mediaEmbedUrl(item);
  const imageSrc = isImage ? item.url || item.thumbnail_url : null;
  // Not embeddable: fall back to the external link.
  if (!isImage && !embed)
    return (
      <a href={item.url} target="_blank" rel="noreferrer" className={cardClass}>
        <Thumb item={item} />
        <Body item={item} />
      </a>
    );
  const tall = item.media_type === "reel";
  const audio = item.media_type === "podcast";
  return (
    <>
      <button type="button" className={cardClass} onClick={() => setOpen(true)} aria-label={`Open ${item.title}`}>
        <Thumb item={item} />
        <Body item={item} />
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
