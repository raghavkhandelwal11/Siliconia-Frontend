"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProductPage } from "@/lib/pdp";
import { Icon } from "@/components/ui/Icon";

// UI-PUB-04 gallery: large photo with a hover zoom and thumbnails.
export function Gallery({ images, name }: { images: ProductPage["images"]; name: string }) {
  const t = useTranslations("pdp.gallery");
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  if (images.length === 0) {
    return (
      <div className="card flex aspect-square items-center justify-center text-muted">
        <Icon name="camera" size={48} />
      </div>
    );
  }
  const img = images[i];
  return (
    <div className="space-y-3">
      <div
        className="card relative aspect-square cursor-zoom-in overflow-hidden"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the API serves sized JPEGs */}
        <img
          key={img.url}
          src={img.url}
          alt={img.alt || t("photo", { n: i + 1, name })}
          className="pop size-full object-cover transition-transform duration-200"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t("previous")}
              onClick={() => setI((i - 1 + images.length) % images.length)}
              className="glass absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-card"
            >
              <Icon name="arrow" size={18} className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label={t("next")}
              onClick={() => setI((i + 1) % images.length)}
              className="glass absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-card"
            >
              <Icon name="arrow" size={18} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={t("thumbnails")}>
          {images.map((im, j) => (
            <li key={im.url}>
              <button
                type="button"
                onClick={() => setI(j)}
                aria-label={t("show", { n: j + 1 })}
                aria-current={j === i ? "true" : undefined}
                className={`block size-16 overflow-hidden rounded-xl border-2 transition sm:size-20 ${j === i ? "border-brand shadow-card" : "border-transparent opacity-70 hover:opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
                <img src={im.url} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
