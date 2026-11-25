"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { uploadReviewImage, useWriteReview } from "@/lib/m4";
import { Alert, Button } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";

/** Rate and review a delivered item, with up to 5 photos (UI-BUY-07). */
export function ReviewForm({ itemId }: { itemId: string }) {
  const t = useTranslations("m4");
  const write = useWriteReview();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [uploadError, setUploadError] = useState<string>();
  if (write.isSuccess) return <p className="text-sm font-medium text-success">{t("thanks")}</p>;
  if (!open) {
    return (
      <Button variant="ghost" className="min-h-9 px-3" onClick={() => setOpen(true)}>
        {t("writeReview")}
      </Button>
    );
  }
  return (
    <form
      className="mt-2 w-full space-y-3 rounded-xl border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (rating) write.mutate({ itemId, rating, title, body, photoIds: photos.map((p) => p.id) });
      }}
    >
      <fieldset className="flex gap-1">
        <legend className="mb-1 text-sm font-medium">{t("yourRating")}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={t("starsN", { n })}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            className="text-gold"
          >
            <Icon name="star" size={24} className={n <= rating ? "fill-current" : "opacity-30"} />
          </button>
        ))}
      </fieldset>
      <input
        aria-label={t("title")}
        placeholder={t("title")}
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm"
      />
      <textarea
        aria-label={t("body")}
        placeholder={t("body")}
        rows={3}
        maxLength={3000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface p-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element -- preview
          <img key={p.id} src={p.url} alt="" className="size-14 rounded-lg object-cover" />
        ))}
        {photos.length < 5 && (
          <label className="cursor-pointer rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted">
            {t("addPhoto")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploadError(undefined);
                uploadReviewImage(f)
                  .then((p) => setPhotos((ps) => [...ps, p]))
                  .catch((err) => setUploadError(err instanceof ApiError ? err.message : t("uploadError")));
              }}
            />
          </label>
        )}
      </div>
      {uploadError && <Alert>{uploadError}</Alert>}
      {write.isError && <Alert>{write.error instanceof ApiError ? write.error.message : t("loadError")}</Alert>}
      <Button type="submit" className="min-h-9 px-4" disabled={!rating || write.isPending}>
        {t("submitReview")}
      </Button>
    </form>
  );
}
