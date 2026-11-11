import { useEffect, useState, type CSSProperties } from "react";
import { ImageOff } from "lucide-react";

type AssetImageProps = {
  src: string;
  alt: string;
  /** Short label shown inside the fallback panel when the artwork cannot load. */
  label: string;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Extra classes applied only to the fallback panel (e.g. min-height). */
  fallbackClassName?: string | undefined;
  testId: string;
};

/**
 * Renders a Lovable-managed artwork asset (served from the /__l5e asset proxy).
 * Outside the Lovable editor the proxy is absent, so the image degrades to a
 * labeled placeholder — compact previews and the zoom dialog stay consistent,
 * and the real artwork shows again wherever the proxy exists. Report metrics
 * are unaffected either way.
 */
export function AssetImage({ src, alt, label, className, style, fallbackClassName, testId }: AssetImageProps) {
  const [failed, setFailed] = useState(false);
  // SSR-rendered images can fail before React hydrates, so onError alone is
  // not enough: a ref check catches images that are already broken at mount.
  useEffect(() => setFailed(false), [src]);

  const checkAlreadyBroken = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  };

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        data-testid={testId}
        data-asset-src={src}
        data-asset-fallback="true"
        style={style}
        className={`flex min-h-28 flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted p-4 text-center ${fallbackClassName ?? ""} ${className ?? ""}`}
      >
        <ImageOff aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs leading-4 text-muted-foreground">Arte indisponível nesta visualização. Os dados do relatório não mudam.</p>
      </div>
    );
  }

  return (
    <img
      ref={(el) => checkAlreadyBroken(el)}
      src={src}
      alt={alt}
      data-testid={testId}
      data-asset-src={src}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}