import fullLogoAsset from "@/assets/millennium-logo-full.png.asset.json";
import markLogoAsset from "@/assets/millennium-logo-mark.png.asset.json";
import taglineAsset from "@/assets/millennium-tagline.png.asset.json";
import wordmarkAsset from "@/assets/millennium-wordmark.png.asset.json";
import { cn } from "@/lib/utils";

type MillenniumLogoProps = {
  variant?: "full" | "mark" | "wordmark" | "tagline" | "responsive";
  className?: string;
  decorative?: boolean;
  priority?: boolean;
};

const logoAlt = "The Millennium Multispeciality Hospital";

export function MillenniumLogo({
  variant = "full",
  className,
  decorative = false,
  priority = false,
}: MillenniumLogoProps) {
  const sharedProps = {
    alt: decorative ? "" : logoAlt,
    decoding: "async" as const,
    draggable: false,
    fetchPriority: priority ? ("high" as const) : ("auto" as const),
  };

  if (variant === "mark") {
    return (
      <img
        {...sharedProps}
        src={markLogoAsset.url}
        width={493}
        height={502}
        className={cn("block h-auto object-contain", className)}
      />
    );
  }

  if (variant === "wordmark" || variant === "tagline") {
    const asset = variant === "wordmark" ? wordmarkAsset : taglineAsset;
    return (
      <img
        {...sharedProps}
        src={asset.url}
        width={variant === "wordmark" ? 1366 : 1236}
        height={variant === "wordmark" ? 128 : 76}
        className={cn("block h-auto object-contain", className)}
      />
    );
  }

  if (variant === "responsive") {
    return (
      <span className={cn("flex items-center", className)}>
        <img
          {...sharedProps}
          src={markLogoAsset.url}
          width={493}
          height={502}
          className="block h-full w-auto shrink-0 sm:hidden"
        />
        <span className="ml-1.5 grid min-w-0 flex-1 gap-1 sm:hidden">
          <img {...sharedProps} src={wordmarkAsset.url} width={1366} height={128} className="block w-full" />
          <img {...sharedProps} src={taglineAsset.url} width={1236} height={76} className="block w-[90%]" />
        </span>
        <img
          {...sharedProps}
          src={fullLogoAsset.url}
          width={1837}
          height={530}
          className="hidden size-full object-contain object-left sm:block"
        />
      </span>
    );
  }

  return (
    <img
      {...sharedProps}
      src={fullLogoAsset.url}
      width={1837}
      height={530}
      className={cn("block h-auto object-contain", className)}
    />
  );
}