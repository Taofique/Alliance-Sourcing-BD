"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SubmitEvent,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { BANNER_ACCEPT, MAX_BANNER_BYTES } from "@/lib/banner-upload-limits";
import type { AdminBanner, BannerImageReference } from "@/types/banner";

/** Mirrors the server-side sortOrder range in lib/validations/banner.ts. */
const MAX_SORT_ORDER = 9999;

const inputClassName =
  "w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const labelClassName = "block text-sm font-medium text-slate-800";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50";

type EditorMode = "list" | "create" | "edit";

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

/** Only the editable fields take part in the dirty check. */
function draftKey(value: EditorState) {
  return JSON.stringify([
    value.title,
    value.description,
    value.imageAlt,
    value.ctaText,
    value.ctaHref,
    value.hasCta,
    value.sortOrder,
    value.isPublished,
  ]);
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

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function BannerEditor({ banners }: { banners: AdminBanner[] }) {
  const router = useRouter();
  const id = useId();

  // Handler guards: a disabled button is not enough on its own.
  const uploading = useRef(false);
  const saving = useRef(false);
  const listBusyRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const editorHeadingRef = useRef<HTMLHeadingElement>(null);
  // Bumped on every context change so a late response cannot touch a new draft.
  const contextToken = useRef(0);
  // Consumed by the focus effect after the new view has rendered.
  const focusIntent = useRef<{ returnTo: HTMLElement | null } | null>(null);

  const [mode, setMode] = useState<EditorMode>("list");
  const [state, setState] = useState<EditorState>(() =>
    blankState(nextSortOrderFor(banners)),
  );
  /** Only set while an uploaded image is not saved yet. */
  const [pendingImage, setPendingImage] =
    useState<BannerImageReference | null>(null);
  /** A file the user picked but has not uploaded yet. */
  const [selectedName, setSelectedName] = useState("");
  const [uploadingNow, setUploadingNow] = useState(false);
  const [savingNow, setSavingNow] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const editing =
    banners.find((banner) => banner.id === state.editingId) ?? null;
  const savedImage: BannerImageReference | null = editing
    ? { imageUrl: editing.imageUrl, publicId: editing.publicId ?? "" }
    : null;
  const previewImage = pendingImage ?? savedImage;
  const isCreate = state.editingId === null;

  // Any in-flight request freezes the whole editor.
  const busy = savingNow || uploadingNow || Boolean(busyId);

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  /** Clears the real file input, not just its tracked name. */
  function clearFileSelection() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedName("");
  }

  function resetDraft() {
    setState(blankState(nextSortOrderFor(banners)));
    setPendingImage(null);
    clearFileSelection();
    setError("");
  }

  function isDirty() {
    if (pendingImage || selectedName) return true;
    const baseline = editing ? toState(editing) : blankState(nextSortOrderFor(banners));
    return draftKey(state) !== draftKey(baseline);
  }

  function confirmDiscard() {
    if (!isDirty()) return true;

    return window.confirm(
      editing
        ? `“${editing.title}” has unsaved changes. Discard them?`
        : "This new banner has unsaved changes. Discard them?",
    );
  }

  function openCreate(trigger: HTMLElement) {
    if (busy || !confirmDiscard()) return;

    contextToken.current += 1;
    resetDraft();
    setMessage("");
    setMode("create");
    focusIntent.current = { returnTo: trigger };
  }

  function openEdit(banner: AdminBanner, trigger: HTMLElement) {
    if (busy || !confirmDiscard()) return;

    contextToken.current += 1;
    setState(toState(banner));
    setPendingImage(null);
    clearFileSelection();
    setError("");
    setMessage("");
    setMode("edit");
    focusIntent.current = { returnTo: trigger };
  }

  /** Returns to the list. `keepMessage` retains a post-save confirmation. */
  function returnToList(trigger: HTMLElement | null, keepMessage = false) {
    if (busy || !confirmDiscard()) return;

    contextToken.current += 1;
    resetDraft();
    if (!keepMessage) setMessage("");
    setMode("list");
    focusIntent.current = { returnTo: trigger };
  }

  // Runs after the target view has rendered, never on the initial mount.
  useEffect(() => {
    const intent = focusIntent.current;
    if (!intent) return;
    focusIntent.current = null;

    if (intent.returnTo?.isConnected) {
      intent.returnTo.focus();
      return;
    }

    const heading = mode === "list" ? listHeadingRef.current : editorHeadingRef.current;
    // The admin header is sticky, so scroll-mt keeps the heading clear of it.
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "start" });
  }, [mode]);

  async function handleUpload(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploading.current || busy) return;

    const token = contextToken.current;
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

      if (contextToken.current !== token) return;

      if (!response.ok || !result.image) {
        setError(
          result.message ??
            "The upload failed. Your saved image has not changed.",
        );
        return;
      }

      // The saved record stays untouched until the banner itself is saved.
      setPendingImage(result.image);
      setMessage("Image uploaded. Save the banner to keep it.");
      clearFileSelection();
      form.reset();
    } catch {
      if (contextToken.current === token) {
        setError("Unable to confirm the upload. Your saved image is unchanged.");
      }
    } finally {
      uploading.current = false;
      setUploadingNow(false);
    }
  }

  async function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving.current || busy) return;

    setError("");
    setMessage("");

    if (selectedName) {
      setError(
        "The selected file has not been uploaded. Upload it, or remove the selection, before saving.",
      );
      return;
    }

    if (isCreate && !pendingImage) {
      setError("Upload a background image before creating this banner.");
      return;
    }

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

    // A text-only edit omits the image so the stored one is kept.
    if (pendingImage) payload.image = pendingImage;

    const token = contextToken.current;
    const editingId = state.editingId;
    const wasPublished = state.isPublished;
    const creating = isCreate;

    saving.current = true;
    setSavingNow(true);

    try {
      const response = await fetch(
        creating ? "/api/banners" : `/api/banners/${editingId}`,
        {
          method: creating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      if (contextToken.current !== token) return;

      if (!response.ok) {
        // Nothing is reset here: the user keeps every unsaved value.
        setError(await readError(response, "Unable to save the banner."));
        return;
      }

      setMessage(
        creating
          ? "Banner created."
          : wasPublished
            ? "Banner saved and live on the homepage."
            : "Banner saved as a draft.",
      );

      contextToken.current += 1;
      setState(blankState(nextSortOrderFor(banners)));
      setPendingImage(null);
      clearFileSelection();
      setMode("list");
      focusIntent.current = { returnTo: null };
      router.refresh();
    } catch {
      if (contextToken.current === token) {
        setError("Unable to connect. Your changes are still here.");
      }
    } finally {
      saving.current = false;
      setSavingNow(false);
    }
  }

  async function handleDelete(banner: AdminBanner) {
    if (listBusyRef.current || busy) return;

    const confirmed = window.confirm(
      `Delete the banner “${banner.title}”? This removes it from the homepage and cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    listBusyRef.current = true;
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
        setError(await readError(response, "Unable to delete the banner."));
        return;
      }

      setMessage(`Deleted “${banner.title}”.`);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      listBusyRef.current = false;
      setBusyId("");
    }
  }

  async function handleMove(banner: AdminBanner, direction: -1 | 1) {
    if (listBusyRef.current || busy) return;

    const index = banners.findIndex((item) => item.id === banner.id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= banners.length) return;

    const ids = banners.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);

    setError("");
    setMessage("");
    listBusyRef.current = true;
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
      listBusyRef.current = false;
      setBusyId("");
    }
  }

  // ----------------------------------------------------------------- list
  if (mode === "list") {
    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            ref={listHeadingRef}
            tabIndex={-1}
            className="scroll-mt-24 text-lg font-semibold text-slate-900 outline-none sm:text-xl"
          >
            All banners ({banners.length})
          </h2>

          <button
            type="button"
            onClick={(event) => openCreate(event.currentTarget)}
            disabled={busy}
            className={primaryButtonClassName}
          >
            <Plus className="size-4" aria-hidden="true" />
            New banner
          </button>
        </div>

        {message && (
          <p
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {banners.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ImagePlus className="mx-auto size-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-900">No banners yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              The homepage shows a plain title until you add the first banner.
            </p>
            <button
              type="button"
              onClick={(event) => openCreate(event.currentTarget)}
              disabled={busy}
              className={`mt-5 ${primaryButtonClassName}`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Create the first banner
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {banners.map((banner, index) => (
              <li
                key={banner.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 sm:w-44">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.imageAlt}
                      width={176}
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

                    <p className="mt-2 font-semibold break-words text-slate-900">
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
                    onClick={(event) => openEdit(banner, event.currentTarget)}
                    disabled={busy}
                    className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(banner, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Move “${banner.title}” up`}
                    className="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(banner, 1)}
                    disabled={busy || index === banners.length - 1}
                    aria-label={`Move “${banner.title}” down`}
                    className="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(banner)}
                    disabled={busy}
                    className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------- editor
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            ref={editorHeadingRef}
            tabIndex={-1}
            className="scroll-mt-24 text-lg font-semibold text-slate-900 outline-none sm:text-xl"
          >
            {isCreate ? "New banner" : "Edit banner"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isCreate
              ? "Add a slide to the homepage carousel."
              : `Editing “${editing?.title ?? "this banner"}”.`}
          </p>
        </div>

        <button
          type="button"
          onClick={(event) => returnToList(event.currentTarget)}
          disabled={busy}
          className={secondaryButtonClassName}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to banners
        </button>
      </div>

      {/* Step 1 of 2: upload. A sibling form, so the two steps never nest. */}
      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Background image
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Two steps: upload the image, then save the banner. Until you save,
          the live banner keeps the image it already has.
        </p>

        <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-72">
          {previewImage ? (
            <Image
              src={previewImage.imageUrl}
              alt={state.imageAlt || "Banner preview"}
              width={768}
              height={288}
              className="h-full w-full object-cover"
            />
          ) : (
            <p className="px-6 text-center text-sm text-slate-500">
              No image yet. Upload one to continue.
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {pendingImage
            ? "Uploaded, not saved yet. Your live banner is unchanged until you save."
            : editing
              ? "Saving without a new upload keeps the current image."
              : "A new banner cannot be saved until an image is uploaded."}
        </p>

        <form onSubmit={handleUpload} aria-busy={uploadingNow} className="mt-4">
          <fieldset disabled={busy} className="min-w-0">
            <label htmlFor={`${id}-file`} className={labelClassName}>
              Choose an image
            </label>

            <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15">
              <input
                ref={fileInputRef}
                id={`${id}-file`}
                name="file"
                type="file"
                required
                accept={BANNER_ACCEPT}
                aria-describedby={`${id}-file-help ${id}-file-selection`}
                onChange={(event) => {
                  setSelectedName(event.currentTarget.files?.[0]?.name ?? "");
                  setError("");
                  setMessage("");
                }}
                className="block w-full min-w-0 cursor-pointer text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-700 file:shadow-sm hover:file:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p id={`${id}-file-help`} className="mt-3 text-xs text-slate-500">
                PNG, JPG, WebP, AVIF or SVG · Up to 2 MiB · Static images only ·
                Wide photos work best.
              </p>
            </div>

            <p
              id={`${id}-file-selection`}
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
                {uploadingNow ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="size-4" aria-hidden="true" />
                )}
                {uploadingNow ? "Uploading…" : "Upload image"}
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
            </div>
          </fieldset>
        </form>
      </section>

      {/* Step 2 of 2: save. */}
      <form onSubmit={handleSave} className="mt-4 min-w-0 space-y-4">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <Group
            title="Content"
            description="The title, description and image description shown on the slide."
          >
            <Field
              label="Title"
              htmlFor={`${id}-title`}
              required
              hint={`${state.title.length}/160 characters`}
            >
              <input
                id={`${id}-title`}
                name="title"
                type="text"
                required
                maxLength={160}
                value={state.title}
                onChange={(event) => update("title", event.currentTarget.value)}
                className={inputClassName}
                placeholder="Global apparel sourcing partner"
              />
            </Field>

            <Field
              label="Description"
              htmlFor={`${id}-description`}
              required
              hint={`${state.description.length}/600 characters`}
            >
              <textarea
                id={`${id}-description`}
                name="description"
                required
                rows={5}
                maxLength={600}
                value={state.description}
                onChange={(event) =>
                  update("description", event.currentTarget.value)
                }
                className={`${inputClassName} resize-y`}
                placeholder="One or two sentences shown under the title."
              />
            </Field>

            <Field
              label="Image alt text"
              htmlFor={`${id}-imageAlt`}
              required
              hint="Describes the photo, not the title. Read aloud by screen readers."
            >
              <input
                id={`${id}-imageAlt`}
                name="imageAlt"
                type="text"
                required
                maxLength={200}
                value={state.imageAlt}
                onChange={(event) =>
                  update("imageAlt", event.currentTarget.value)
                }
                className={inputClassName}
                placeholder="Cut-to-sew garment factory floor"
              />
            </Field>
          </Group>

          <Group
            title="Call-to-action"
            description="Optional button shown under the description."
          >
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
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Button text" htmlFor={`${id}-ctaText`} required>
                  <input
                    id={`${id}-ctaText`}
                    name="ctaText"
                    type="text"
                    required
                    maxLength={60}
                    value={state.ctaText}
                    onChange={(event) =>
                      update("ctaText", event.currentTarget.value)
                    }
                    className={inputClassName}
                    placeholder="Explore our factory"
                  />
                </Field>

                <Field
                  label="Button destination"
                  htmlFor={`${id}-ctaHref`}
                  required
                  hint="A site path starting with one slash, or a full https:// address."
                >
                  <input
                    id={`${id}-ctaHref`}
                    name="ctaHref"
                    type="text"
                    required
                    maxLength={2048}
                    value={state.ctaHref}
                    onChange={(event) =>
                      update("ctaHref", event.currentTarget.value)
                    }
                    className={inputClassName}
                    placeholder="/about or https://example.com"
                  />
                </Field>
              </div>
            )}
          </Group>

          <Group
            title="Publication"
            description="Drafts stay hidden from the homepage."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Sort order"
                htmlFor={`${id}-sortOrder`}
                hint="Lower numbers appear first."
              >
                <input
                  id={`${id}-sortOrder`}
                  name="sortOrder"
                  type="number"
                  required
                  min={0}
                  max={MAX_SORT_ORDER}
                  step={1}
                  value={state.sortOrder}
                  onChange={(event) =>
                    update("sortOrder", Number(event.currentTarget.value))
                  }
                  className={inputClassName}
                />
              </Field>

              <div className="flex items-center">
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
          </Group>

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

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <button type="submit" className={primaryButtonClassName}>
              {savingNow ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {savingNow
                ? "Saving…"
                : isCreate
                  ? "Create banner"
                  : "Save changes"}
            </button>

            <button
              type="button"
              onClick={(event) => returnToList(event.currentTarget)}
              className={secondaryButtonClassName}
            >
              Cancel
            </button>

            <p className="text-xs text-slate-500 sm:ml-auto">
              {savingNow
                ? "Saving…"
                : isCreate
                  ? "Uploading first, then saving, creates the banner."
                  : "Saving without a new upload keeps the current image."}
            </p>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

/**
 * Appends after the highest existing sort order instead of the record count, so
 * a list with gaps or manual values still gets the next valid position.
 */
function nextSortOrderFor(banners: AdminBanner[]) {
  const highest = banners.reduce(
    (max, banner) => (banner.sortOrder > max ? banner.sortOrder : max),
    -1,
  );

  return Math.min(Math.max(highest + 1, 0), MAX_SORT_ORDER);
}
