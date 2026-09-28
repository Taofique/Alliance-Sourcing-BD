"use client";

import Image from "next/image";
import { useId, useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { LOGO_ACCEPT, MAX_LOGO_BYTES } from "@/lib/logo-upload-limits";
import type { SiteLogo } from "@/types/site-settings";

export default function LogoUploadForm({ logo }: { logo: SiteLogo }) {
  const router = useRouter();
  const id = useId();
  const uploading = useRef(false);

  const [pending, setPending] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploading.current) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");

    setError("");
    setMessage("");

    if (!(file instanceof File) || !file.size || file.size > MAX_LOGO_BYTES) {
      setError("Choose a nonempty image of 2 MiB or smaller.");
      return;
    }

    data.set("logoKey", logo.key);
    uploading.current = true;
    setPending(true);

    try {
      const response = await fetch("/api/site-settings/logo", {
        method: "POST",
        body: data,
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: {
        message?: string;
        imageUrl?: string;
      } = await response.json();

      if (!response.ok || !result.imageUrl) {
        setError(result.message ?? "Unable to replace the logo.");
        return;
      }

      setMessage("Logo saved successfully.");
      setSelectedName("");
      form.reset();
      router.refresh();
    } catch {
      setError(
        "Unable to confirm the upload. Reload settings before retrying.",
      );
    } finally {
      uploading.current = false;
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={pending}
      className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <fieldset disabled={pending} className="min-w-0 w-full">
        <legend className="px-0 text-base font-semibold text-slate-900">
          {logo.title}
        </legend>

        <p className="mt-1 text-sm text-slate-500">{logo.subtitle}</p>

        <div className="mt-5 flex h-44 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex size-32 items-center justify-center rounded-xl bg-white p-3 shadow-sm">
            <Image
              src={logo.imageUrl}
              alt={`Currently saved ${logo.title} ${logo.subtitle} logo`}
              width={104}
              height={104}
              className="size-26 object-contain"
            />
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-500">
          Currently published logo
        </p>

        <div className="mt-6">
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-800"
          >
            Choose a replacement
          </label>

          <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 hover:border-slate-400">
            <input
              id={id}
              name="file"
              type="file"
              accept={LOGO_ACCEPT}
              required
              aria-describedby={`${id}-help ${id}-selection`}
              onChange={(event) => {
                setSelectedName(event.currentTarget.files?.[0]?.name ?? "");
                setError("");
                setMessage("");
              }}
              className="block w-full min-w-0 cursor-pointer text-sm text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-blue-700 file:shadow-sm hover:file:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p
              id={`${id}-help`}
              className="mt-3 text-xs leading-5 text-slate-500"
            >
              PNG, JPG, WebP, AVIF or SVG · Up to 2 MiB.
              <br />
              Static images only. SVG must be self-contained.
            </p>
          </div>

          <p
            id={`${id}-selection`}
            aria-live="polite"
            className="mt-2 min-h-5 text-xs break-all text-slate-500"
          >
            {selectedName
              ? `Ready to upload: ${selectedName}`
              : "Your current logo stays until you upload a replacement."}
          </p>
        </div>

        <button
          type="submit"
          disabled={pending || !selectedName}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload size={17} aria-hidden="true" />
          )}

          {pending ? "Uploading…" : "Upload and replace"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Uploading immediately updates the website logo.
        </p>
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
          className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
        >
          <CheckCircle2 size={17} className="shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </form>
  );
}
