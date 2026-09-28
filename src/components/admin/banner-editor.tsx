"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type SubmitEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  BANNER_ACCEPT,
  MAX_BANNER_BYTES,
} from "@/lib/banner-upload-limits";
import type { AdminBanner, BannerImageReference } from "@/types/banner";

const inputClassName =
  "w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const labelClassName = "block text-sm font-medium text-slate-800";

type EditorState = {
  /** null creates a new slide; an id edits that slide. */
  editingId: string | null;
  title: string;
  description: string;
  imageAlt: string;
  ctaText: string;
  ctaHref: string;
  hasCta: boolean;
  sortOrder: number;
  isPublished: boolean;
};

function toState(banner: AdminBanner): EditorState {
  return {
    editingId: banner.id,
    title: banner.title,
    description: banner.description,
    imageAlt: banner.imageAlt,
    ctaText: banner.cta?.text ?? "",
    ctaHref: banner.cta?.href ?? "",
    hasCta: Boolean(banner.cta),
    sortOrder: banner.sortOrder,
    isPublished: banner.isPublished,
  };
}

function blankState(nextSortOrder: number): EditorState {
  return {
    editingId: null,
    title: "",
    description: "",
    imageAlt: "",
    ctaText: "",
    ctaHref: "",
    hasCta: true,
    sortOrder: nextSortOrder,
    isPublished: false,
  };
}

async function readError(response: Response, fallback: string) {
  if (response.status === 401) return "Your session expired. Sign in again.";

  try {
    const result: { message?: string } = await response.json();
    return result.message ?? fallback;
  } catch {
    return fallback;
  }
}

export default function BannerEditor({ banners }: { banners: AdminBanner[] }) {
  const router = useRouter();
  const formId = useId();
  const uploading = useRef(false);
  const saving = useRef(false);

  const [state, setState] = useState<EditorState>(() =>
    blankState(banners.length),
  );
  /** Only set while an unsaved upload is pending. */
  const [pendingImage, setPendingImage] =
    useState<BannerImageReference | null>(null);
  const [uploadingNow, setUploadingNow] = useState(false);
  const [savingNow, setSavingNow] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const editing = banners.find((banner) => banner.id === state.editingId) ?? null;
  const savedImage: BannerImageReference | null = editing
    ? { imageUrl: editing.imageUrl, publicId: editing.publicId ?? "" }
    : null;
  const previewImage = pendingImage ?? savedImage;
  const listBusy = Boolean(busyId) || savingNow || uploadingNow;

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  /** Clears the form only, so a caller can keep its own success message. */
  function resetForm() {
    setState(blankState(banners.length));
    setPendingImage(null);
    setSelectedName("");
    setError("");
  }

  function startCreate() {
    resetForm();
    setMessage("");
  }

  function startEdit(banner: AdminBanner) {
    setState(toState(banner));
    setPendingImage(null);
    setSelectedName("");
    setError("");
    setMessage("");
  }

  async function handleUpload(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploading.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    setError("");
    setMessage("");

    if (!(file instanceof File) || !file.size || file.size > MAX_BANNER_BYTES) {
      setError("Choose a nonempty image of 2 MiB or smaller.");
      return;
    }

    uploading.current = true;
    setUploadingNow(true);

    try {
      const response = await fetch("/api/banners/upload", {
        method: "POST",
        body: data,
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: { message?: string; image?: BannerImageReference } =
        await response.json();

      if (!response.ok || !result.image) {
        setError(
          result.message ??
            "The upload failed. Your saved image has not changed.",
        );
        return;
      }

      // The saved record is untouched until the slide itself is saved.
      setPendingImage(result.image);
      setMessage("Image uploaded. Save the slide to keep it.");
      setSelectedName("");
      form.reset();
    } catch {
      setError("Unable to confirm the upload. Your saved image is unchanged.");
    } finally {
      uploading.current = false;
      setUploadingNow(false);
    }
  }

  async function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving.current) return;

    setError("");
    setMessage("");

    const payload: Record<string, unknown> = {
      title: state.title,
      description: state.description,
      imageAlt: state.imageAlt,
      cta: state.hasCta
        ? { text: state.ctaText, href: state.ctaHref }
        : null,
      sortOrder: state.sortOrder,
      isPublished: state.isPublished,
    };

    // Text-only edits omit the image entirely so the stored one is kept.
    if (pendingImage) payload.image = pendingImage;

    saving.current = true;
    setSavingNow(true);

    try {
      const isCreate = state.editingId === null;
      const response = await fetch(
        isCreate ? "/api/banners" : `/api/banners/${state.editingId}`,
        {
          method: isCreate ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        setError(await readError(response, "Unable to save the slide."));
        return;
      }

      setMessage(
        isCreate
          ? "Banner created."
          : state.isPublished
            ? "Banner saved and live on the homepage."
            : "Banner saved as a draft.",
      );
      setPendingImage(null);
      router.refresh();
      // Reset to a blank slide but keep the confirmation visible.
      resetForm();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      saving.current = false;
      setSavingNow(false);
    }
  }

  async function handleDelete(banner: AdminBanner) {
    const confirmed = window.confirm(
      `Delete the banner “${banner.title}”? This removes it from the homepage and cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setBusyId(banner.id);

    try {
      const response = await fetch(`/api/banners/${banner.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        setError(await readError(response, "Unable to delete the slide."));
        return;
      }

      if (state.editingId === banner.id) resetForm();
      setMessage(`Deleted “${banner.title}”.`);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  async function handleMove(banner: AdminBanner, direction: -1 | 1) {
    const index = banners.findIndex((item) => item.id === banner.id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= banners.length) return;

    const ids = banners.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);

    setError("");
    setMessage("");
    setBusyId(banner.id);

    try {
      const response = await fetch("/api/banners/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        setError(await readError(response, "Unable to save the new order."));
        return;
      }

      setMessage("Banner order saved.");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <section aria-labelledby="banner-list-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="banner-list-heading" className="text-lg font-semibold text-slate-900">
            Slides ({banners.length})
          </h2>

          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="size-4" aria-hidden="true" />
            New banner
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ImagePlus className="mx-auto size-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-900">No banners yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              The homepage shows a plain title until you add the first slide.
            </p>
            <button
              type="button"
              onClick={startCreate}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create the first banner
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {banners.map((banner, index) => {
              const isEditing = state.editingId === banner.id;

              return (
                <li
                  key={banner.id}
                  className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
                    isEditing ? "border-blue-400" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 sm:w-40">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.imageAlt}
                        width={160}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          #{index + 1}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            banner.isPublished
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {banner.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <p className="mt-2 font-semibold text-slate-900">
                        {banner.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {banner.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => startEdit(banner)}
                      className="min-h-10 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(banner, -1)}
                      disabled={listBusy || index === 0}
                      aria-label={`Move “${banner.title}” up`}
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(banner, 1)}
                      disabled={listBusy || index === banners.length - 1}
                      aria-label={`Move “${banner.title}” down`}
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(banner)}
                      disabled={listBusy}
                      className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-labelledby={`${formId}-heading`}
        className="xl:sticky xl:top-24 xl:self-start"
      >
        <form
          onSubmit={handleSave}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <fieldset disabled={savingNow} className="space-y-5">
            <legend id={`${formId}-heading`} className="text-lg font-semibold text-slate-900">
              {editing ? "Edit banner" : "New banner"}
            </legend>

            <div>
              <label htmlFor={`${formId}-title`} className={labelClassName}>
                Title <span className="text-red-600">*</span>
              </label>
              <input
                id={`${formId}-title`}
                name="title"
                type="text"
                required
                maxLength={160}
                value={state.title}
                onChange={(event) => update("title", event.currentTarget.value)}
                className={`mt-2 ${inputClassName}`}
                placeholder="Global apparel sourcing partner"
              />
            </div>

            <div>
              <label htmlFor={`${formId}-description`} className={labelClassName}>
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id={`${formId}-description`}
                name="description"
                required
                rows={3}
                maxLength={600}
                value={state.description}
                onChange={(event) =>
                  update("description", event.currentTarget.value)
                }
                className={`mt-2 ${inputClassName}`}
                placeholder="One or two sentences shown under the title."
              />
            </div>

            <div>
              <span className={labelClassName}>Background image</span>

              <div className="mt-2 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {previewImage ? (
                  <Image
                    src={previewImage.imageUrl}
                    alt={state.imageAlt || "Banner preview"}
                    width={384}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="px-4 text-center text-sm text-slate-500">
                    No image yet. Uploading is required before the first save.
                  </p>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {pendingImage
                  ? "Uploaded and not saved yet. Your previously saved image is untouched until you save this slide."
                  : editing
                    ? "Saving without a new upload keeps this image."
                    : "Upload a background below before saving this slide."}
              </p>
            </div>

            <div>
              <label htmlFor={`${formId}-imageAlt`} className={labelClassName}>
                Image alt text <span className="text-red-600">*</span>
              </label>
              <input
                id={`${formId}-imageAlt`}
                name="imageAlt"
                type="text"
                required
                maxLength={200}
                value={state.imageAlt}
                onChange={(event) =>
                  update("imageAlt", event.currentTarget.value)
                }
                className={`mt-2 ${inputClassName}`}
                placeholder="Cut-to-sew garment factory floor"
              />
              <p className="mt-1 text-xs text-slate-500">
                Describes the photo, not the title. Read aloud by screen
                readers.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={state.hasCta}
                  onChange={(event) =>
                    update("hasCta", event.currentTarget.checked)
                  }
                  className="size-4 rounded border-slate-300 text-blue-600"
                />
                Show a call-to-action button
              </label>

              {state.hasCta && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor={`${formId}-ctaText`}
                      className={labelClassName}
                    >
                      Button text
                    </label>
                    <input
                      id={`${formId}-ctaText`}
                      name="ctaText"
                      type="text"
                      required
                      maxLength={60}
                      value={state.ctaText}
                      onChange={(event) =>
                        update("ctaText", event.currentTarget.value)
                      }
                      className={`mt-2 ${inputClassName}`}
                      placeholder="Explore our factory"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`${formId}-ctaHref`}
                      className={labelClassName}
                    >
                      Button destination
                    </label>
                    <input
                      id={`${formId}-ctaHref`}
                      name="ctaHref"
                      type="text"
                      required
                      maxLength={2048}
                      value={state.ctaHref}
                      onChange={(event) =>
                        update("ctaHref", event.currentTarget.value)
                      }
                      className={`mt-2 ${inputClassName}`}
                      placeholder="/about or https://example.com"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      A site path starting with one slash, or a full https://
                      address.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-sortOrder`} className={labelClassName}>
                  Sort order
                </label>
                <input
                  id={`${formId}-sortOrder`}
                  name="sortOrder"
                  type="number"
                  required
                  min={0}
                  max={9999}
                  step={1}
                  value={state.sortOrder}
                  onChange={(event) =>
                    update("sortOrder", Number(event.currentTarget.value))
                  }
                  className={`mt-2 ${inputClassName}`}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Lower numbers appear first.
                </p>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={state.isPublished}
                    onChange={(event) =>
                      update("isPublished", event.currentTarget.checked)
                    }
                    className="size-4 rounded border-slate-300 text-blue-600"
                  />
                  Published on the homepage
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={savingNow || uploadingNow}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingNow ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {savingNow
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create banner"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
            >
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              {message}
            </p>
          )}
        </form>

        <form
          onSubmit={handleUpload}
          aria-busy={uploadingNow}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <fieldset disabled={uploadingNow || savingNow}>
            <legend className="text-base font-semibold text-slate-900">
              Background image upload
            </legend>

            <p className="mt-1 text-sm text-slate-600">
              Wide photographs work best. The image is scaled down to 2560px and
              stored in a separate banner folder.
            </p>

            <label htmlFor={`${formId}-file`} className={labelClassName}>
              Choose an image
            </label>

            <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15">
              <input
                id={`${formId}-file`}
                name="file"
                type="file"
                required
                accept={BANNER_ACCEPT}
                aria-describedby={`${formId}-file-help ${formId}-file-selection`}
                onChange={(event) => {
                  setSelectedName(event.currentTarget.files?.[0]?.name ?? "");
                  setError("");
                  setMessage("");
                }}
                className="block w-full min-w-0 cursor-pointer text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-700 file:shadow-sm hover:file:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p id={`${formId}-file-help`} className="mt-3 text-xs text-slate-500">
                PNG, JPG, WebP, AVIF or SVG · Up to 2 MiB. Static images only.
              </p>
            </div>

            <p
              id={`${formId}-file-selection`}
              aria-live="polite"
              className="mt-2 min-h-5 text-xs break-all text-slate-500"
            >
              {selectedName
                ? `Ready to upload: ${selectedName}`
                : "Nothing selected."}
            </p>

            <button
              type="submit"
              disabled={!selectedName}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingNow ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {uploadingNow ? "Uploading…" : "Upload image"}
            </button>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
