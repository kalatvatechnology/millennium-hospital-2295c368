import { PlayCircle } from "lucide-react";
import type { MediaItem } from "@/lib/queries";

const typeLabel: Record<MediaItem["media_type"], string> = {
  youtube: "Video",
  reel: "Reel",
  podcast: "Podcast",
  article: "Article",
};

export function MediaCard({ item }: { item: MediaItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group block border border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className={`grid place-items-center overflow-hidden bg-surface ${item.media_type === "reel" ? "aspect-[9/16]" : "aspect-video"}`}>
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="size-full object-cover" loading="lazy" />
        ) : (
          <PlayCircle className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase text-primary">{typeLabel[item.media_type]}</p>
        <h3 className="mt-2 font-semibold leading-6 group-hover:underline">{item.title}</h3>
        {item.description ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
      </div>
    </a>
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
