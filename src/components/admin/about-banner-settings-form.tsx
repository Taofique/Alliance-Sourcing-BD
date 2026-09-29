"use client";

import { useId, useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Loader2, RotateCcw, Upload, X } from "lucide-react";
import { PAGE_BANNER_FALLBACK_IMAGES } from "@/lib/page-banner-defaults";
import {
  PAGE_BANNER_ACCEPT,
  PAGE_BANNER_MAX_BYTES,
} from "@/lib/validations/page-banner";
import { PAGE_BANNER_LABELS, type PageBannerSlug } from "@/lib/page-banner-routes";
import type { PageBannerImage } from "@/services/page-banners";

const labelClassName = "block text-sm font-medium text-slate-800";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

type AboutBannerSettingsFormProps = {
  /** Which page's banner is being edited. */
  page: PageBannerSlug;
  initialImage: PageBannerImage | null;
};

export default function AboutBannerSettingsForm({
  page,
  initialImage,
}: AboutBannerSettingsFormProps) {
  const router = useRouter();
  const id = useId();

  const [savedImage, setSavedImage] = useState<PageBannerImage | null>(
    initialImage,
  );
  /** An uploaded image that is not saved yet. */
  const [pendingImage, setPendingImage] = useState<PageBannerImage | null>(null);

  const endpoint = `/api/page-banners/${page}`;
  const fallback = PAGE_BANNER_FALLBACK_IMAGES[page];
  /** Explicitly reset to the bundled default photograph. */
  const [clearImage, setClearImage] = useState(false);
  const [selectedName, setSelectedName] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewImage =
    clearImage || (!pendingImage && !savedImage)
      ? fallback
      : (pendingImage ?? savedImage)?.imageUrl;

  const busy = uploading || saving;

  function clearFileSelection() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedName("");
  }

  async function handleUpload(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > PAGE_BANNER_MAX_BYTES
    ) {
      setError("Choose a nonempty image of 2 MiB or smaller.");
      return;
    }

    setError("");
    setMessage("");
    setUploading(true);

    try {
      const response = await fetch(`${endpoint}/upload`, {
        method: "POST",
        body: data,
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: { message?: string; image?: PageBannerImage } =
        await response.json();

      if (!response.ok || !result.image) {
        setError(
          result.message ??
            "The upload failed. Your saved background has not changed.",
        );
        return;
      }

      // The saved setting stays untouched until the banner itself is saved.
      setPendingImage(result.image);
      setClearImage(false);
      setMessage("Image uploaded. Save the banner to keep it.");
      clearFileSelection();
      form.reset();
    } catch {
      setError(
        "Unable to confirm the upload. Your saved background is unchanged.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (selectedName) {
      setError(
        "The selected file has not been uploaded yet. Upload it, or remove the selection, before saving.",
      );
      return;
    }

    /*
     * The effective image is always sent, so the save is a real write and the
     * success message can never describe a no-op. `null` is the explicit
     * "use the bundled default" value.
     */
    const payload = {
      image: clearImage ? null : (pendingImage ?? savedImage),
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Unable to save the About banner.");
        return;
      }

      setMessage(
        clearImage || (!pendingImage && !savedImage)
          ? `${PAGE_BANNER_LABELS[page]} banner saved. It is back to the bundled default photograph.`
          : `${PAGE_BANNER_LABELS[page]} banner saved. It is live on the page.`,
      );
      if (clearImage) setSavedImage(null);
      else if (pendingImage) setSavedImage(pendingImage);
      setPendingImage(null);
      setClearImage(false);
      clearFileSelection();
      router.refresh();
    } catch {
      setError("Unable to connect. Your changes are still here.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 w-full max-w-5xl space-y-6">
      {/* Step 1 of 2: upload. A sibling form, so the two steps never nest. */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">
          {PAGE_BANNER_LABELS[page]} cover photograph
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Two steps: upload the photograph, then save the banner. Until you save,
          the live page keeps the image it already has. Without an upload the
          bundled default photograph is used.
        </p>

        {/* Mirrors the real hero: cover crop, dark overlay, white type. */}
        <div className="relative mt-4 flex h-52 items-center justify-center overflow-hidden rounded-xl bg-slate-900 sm:h-64">
          <Image
            src={previewImage ?? fallback}
            alt="About banner background preview"
            fill
            sizes="1024px"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
          <div className="relative px-6 text-center">
            <p className="text-sm font-medium text-white">Home</p>
            <p className="mt-1 font-heading text-xl font-bold text-white sm:text-2xl">
              About Alliance Sourcing BD
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {clearImage
            ? "Will return to the bundled default photograph when you save."
            : pendingImage
              ? "Uploaded, not saved yet. The live page is unchanged until you save."
              : savedImage
                ? "This photograph is live on the About page."
                : `No photograph is saved, so this page is using the bundled default.`}
        </p>

        <form onSubmit={handleUpload} aria-busy={uploading} className="mt-4">
          <fieldset disabled={busy} className="min-w-0">
            <label htmlFor={`${id}-file`} className={labelClassName}>
              Choose an image
            </label>

            <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
              <input
                ref={fileInputRef}
                id={`${id}-file`}
                name="file"
                type="file"
                required
                accept={PAGE_BANNER_ACCEPT}
                onChange={(event) => {
                  setSelectedName(event.currentTarget.files?.[0]?.name ?? "");
                  setError("");
                  setMessage("");
                }}
                className="block w-full min-w-0 cursor-pointer text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-700 file:shadow-sm hover:file:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-3 text-xs text-slate-500">
                PNG, JPG, WebP, AVIF or SVG · Up to 2 MiB · Static images only ·
                A wide cover photograph works best.
              </p>
            </div>

            <p
              aria-live="polite"
              className="mt-2 min-h-5 text-xs break-all text-slate-500"
            >
              {selectedName
                ? `Selected, not uploaded yet: ${selectedName}`
                : "No file selected."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={!selectedName}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="size-4" aria-hidden="true" />
                )}
                {uploading ? "Uploading…" : "Upload image"}
              </button>

              {selectedName ? (
                <button
                  type="button"
                  onClick={() => {
                    clearFileSelection();
                    setError("");
                    setMessage("");
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <X className="size-4" aria-hidden="true" />
                  Remove selection
                </button>
              ) : null}

              {savedImage || pendingImage ? (
                <button
                  type="button"
                  onClick={() => {
                    setClearImage(true);
                    setPendingImage(null);
                    setMessage("");
                    setError("");
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Use the default photograph
                </button>
              ) : null}
            </div>
          </fieldset>
        </form>
      </section>

      {/* Step 2 of 2: save. */}
      <form onSubmit={handleSave}>
        <fieldset disabled={busy} className="min-w-0">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              {message}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="submit"
              // Nothing is stored unless there is a real change to store. This
              // button used to be live with no pending image, and the request
              // it sent was a no-op that still answered "saved and live" — so
              // the page kept showing the bundled photograph with no
              // explanation. It now cannot be pressed in that state.
              disabled={!pendingImage && !clearImage}
              className={primaryButtonClassName}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {saving ? "Saving…" : "Save banner"}
            </button>

            <p className="text-xs text-slate-500 sm:ml-auto">
              {pendingImage || clearImage ? (
                "Upload, then save — the two steps are separate on purpose."
              ) : (
                "Nothing to save yet. Choose a file, upload it, then save."
              )}
            </p>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
