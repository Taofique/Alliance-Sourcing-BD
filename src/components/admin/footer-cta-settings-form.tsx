"use client";

import {
  useId,
  useRef,
  useState,
  type ReactNode,
  type SubmitEvent,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Loader2, RotateCcw, Upload, X } from "lucide-react";
import { FOOTER_CTA_FALLBACK_IMAGE } from "@/lib/footer-defaults";
import {
  FOOTER_CTA_ACCEPT,
  FOOTER_CTA_MAX_BYTES,
} from "@/lib/validations/footer";
import type { SiteFooterCta, SiteFooterCtaImage } from "@/types/site-settings";

const inputClassName =
  "w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const labelClassName = "block text-sm font-medium text-slate-800";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

type FooterCtaSettingsFormProps = {
  initialCta: SiteFooterCta;
};

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

export default function FooterCtaSettingsForm({
  initialCta,
}: FooterCtaSettingsFormProps) {
  const router = useRouter();
  const id = useId();

  const [enabled, setEnabled] = useState(initialCta.enabled);
  const [heading, setHeading] = useState(initialCta.heading);
  const [description, setDescription] = useState(initialCta.description);
  const [buttonText, setButtonText] = useState(initialCta.buttonText);
  const [buttonHref, setButtonHref] = useState(initialCta.buttonHref);

  const [savedImage, setSavedImage] = useState<SiteFooterCtaImage | null>(
    initialCta.image,
  );
  /** An uploaded image that is not saved yet. */
  const [pendingImage, setPendingImage] = useState<SiteFooterCtaImage | null>(
    null,
  );
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
      ? FOOTER_CTA_FALLBACK_IMAGE
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
      file.size > FOOTER_CTA_MAX_BYTES
    ) {
      setError("Choose a nonempty image of 2 MiB or smaller.");
      return;
    }

    setError("");
    setMessage("");
    setUploading(true);

    try {
      const response = await fetch("/api/site-settings/footer-cta/upload", {
        method: "POST",
        body: data,
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: { message?: string; image?: SiteFooterCtaImage } =
        await response.json();

      if (!response.ok || !result.image) {
        setError(
          result.message ??
            "The upload failed. Your saved background has not changed.",
        );
        return;
      }

      // The saved setting stays untouched until the section itself is saved.
      setPendingImage(result.image);
      setClearImage(false);
      setMessage("Background uploaded. Save the section to keep it.");
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

    const payload: Record<string, unknown> = {
      enabled,
      heading,
      description,
      buttonText,
      buttonHref,
    };

    // Omitted entirely when nothing changed, so a text-only save can never
    // drop the stored photograph.
    if (clearImage) payload.image = null;
    else if (pendingImage) payload.image = pendingImage;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/site-settings/footer-cta", {
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
        setError(result.message ?? "Unable to save the section.");
        return;
      }

      setMessage(
        enabled
          ? "Section saved. It is live on the homepage."
          : "Section saved. It is hidden from the homepage.",
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
        <h3 className="text-base font-semibold text-slate-900">
          Background image
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Two steps: upload the photograph, then save the section. Until you
          save, the live section keeps the image it already has. Without an
          upload the bundled default photograph is used.
        </p>

        <div className="mt-4 flex h-52 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-64">
          <Image
            src={previewImage ?? FOOTER_CTA_FALLBACK_IMAGE}
            alt="Call-to-action background preview"
            width={1024}
            height={400}
            className="h-full w-full object-cover"
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {clearImage
            ? "Will return to the bundled default photograph when you save."
            : pendingImage
              ? "Uploaded, not saved yet. The live section is unchanged until you save."
              : savedImage
                ? "Saving without a new upload keeps this photograph."
                : "Currently using the bundled default photograph."}
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
                accept={FOOTER_CTA_ACCEPT}
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
        <fieldset disabled={busy} className="min-w-0 space-y-6">
          <Group
            title="Visibility"
            description="This section currently appears on the homepage only."
          >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.currentTarget.checked)}
                className="size-4 rounded border-slate-300 text-blue-600"
              />
              Show the section
            </label>
          </Group>

          <Group
            title="Content"
            description="The panel shown over the cover photograph."
          >
            <Field
              label="Heading"
              htmlFor={`${id}-heading`}
              required
              hint={`${heading.length}/160 characters`}
            >
              <input
                id={`${id}-heading`}
                type="text"
                required
                maxLength={160}
                value={heading}
                onChange={(event) => setHeading(event.currentTarget.value)}
                className={inputClassName}
              />
            </Field>

            <Field
              label="Description"
              htmlFor={`${id}-description`}
              hint={`${description.length}/600 characters`}
            >
              <textarea
                id={`${id}-description`}
                rows={4}
                maxLength={600}
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                className={`${inputClassName} resize-y`}
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Button text" htmlFor={`${id}-buttonText`} required>
                <input
                  id={`${id}-buttonText`}
                  type="text"
                  required
                  maxLength={60}
                  value={buttonText}
                  onChange={(event) => setButtonText(event.currentTarget.value)}
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Button destination"
                htmlFor={`${id}-buttonHref`}
                required
                hint="A site path starting with one slash, or a full https:// address."
              >
                <input
                  id={`${id}-buttonHref`}
                  type="text"
                  required
                  maxLength={2048}
                  value={buttonHref}
                  onChange={(event) => setButtonHref(event.currentTarget.value)}
                  className={inputClassName}
                  placeholder="/contact"
                />
              </Field>
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
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {saving ? "Saving…" : "Save section"}
            </button>

            <p className="text-xs text-slate-500 sm:ml-auto">
              Saving here never changes the footer, contact details, logos or
              banners.
            </p>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
