import fullLogoAsset from "@/assets/millennium-hospital-logo.jpg.asset.json";
import markLogoAsset from "@/assets/millennium-hospital-mark.png.asset.json";
import { cn } from "@/lib/utils";

type MillenniumLogoProps = {
  variant?: "full" | "mark" | "responsive";
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
        width={520}
        height={560}
        className={cn("block h-auto object-contain", className)}
      />
    );
  }

  if (variant === "responsive") {
    return (
      <span className={cn("block", className)}>
        <img
          {...sharedProps}
          src={markLogoAsset.url}
          width={520}
          height={560}
          className="block size-full object-contain sm:hidden"
        />
        <img
          {...sharedProps}
          src={fullLogoAsset.url}
          width={1920}
          height={582}
          className="hidden size-full object-contain object-left sm:block"
        />
      </span>
    );
  }

  return (
    <img
      {...sharedProps}
      src={fullLogoAsset.url}
      width={1920}
      height={582}
      className={cn("block h-auto object-contain", className)}
    />
  );
}