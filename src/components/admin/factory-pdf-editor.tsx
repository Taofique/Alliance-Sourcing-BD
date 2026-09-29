"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import {
  FACTORY_PDF_ACCEPT,
  FACTORY_PDF_SIZE_MESSAGE,
  MAX_FACTORY_PDF_BYTES,
} from "@/lib/validations/machinery";
import type { FactoryPdf } from "@/types/machinery";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = buttonClass
  .replace("border-slate-300 bg-white", "border-blue-600 bg-blue-600")
  .replace("text-slate-700 hover:bg-slate-50", "text-white hover:bg-blue-700");
const dangerClass = buttonClass
  .replace("border-slate-300 bg-white", "border-red-200 bg-red-50")
  .replace("text-slate-700 hover:bg-slate-50", "text-red-700 hover:bg-red-100");

type Reply = { message: string; pdf?: FactoryPdf | null };

async function request(
  url: string,
  method: string,
  body?: FormData | unknown,
): Promise<Reply> {
  const response = await fetch(url, {
    method,
    ...(body instanceof FormData
      ? { body }
      : body !== undefined
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {}),
  });
  const result = (await response
    .json()
    .catch(() => ({ message: "Unexpected server response. Please try again." }))) as Reply;
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session expired. Sign in again."
        : result.message,
    );
  }
  return result;
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FactoryPdfEditor({
  initialPdf,
}: {
  initialPdf: FactoryPdf | null;
}) {
  const [saved, setSaved] = useState<FactoryPdf | null>(initialPdf);
  const [staged, setStaged] = useState<FactoryPdf | null>(null);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);

  const busy = phase !== "";
  const dirty = JSON.stringify(staged) !== JSON.stringify(saved);
  const current = staged ?? saved;

  useEffect(() => {
    if (!busy) return;
    const navigate = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || event.defaultPrevented) return;
      if (!window.confirm("A file operation is still running. Leave anyway?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", navigate, true);
    return () => document.removeEventListener("click", navigate, true);
  }, [busy]);

  async function perform(action: string, work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setPhase(action);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Request failed. Please try again.",
      );
    } finally {
      lock.current = false;
      setPhase("");
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || lock.current) return;

    // Checked here to save a round trip; the route enforces both again.
    if (file.type !== FACTORY_PDF_ACCEPT) {
      setError("Choose a PDF document.");
      input.value = "";
      return;
    }
    if (file.size > MAX_FACTORY_PDF_BYTES) {
      setError(FACTORY_PDF_SIZE_MESSAGE);
      input.value = "";
      return;
    }

    await perform("upload", async () => {
      const form = new FormData();
      form.append("file", file);
      const result = await request("/api/machinery/factory-pdf/upload", "POST", form);
      if (!result.pdf) throw new Error("The upload returned no document. Try again.");
      setStaged(result.pdf);
      setMessage("PDF uploaded. Save it to publish it on the page.");
    });
    input.value = "";
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    await perform("save", async () => {
      const result = await request("/api/machinery/factory-pdf", "PATCH", {
        pdf: staged,
      });
      setSaved(result.pdf ?? null);
      setStaged(null);
      setMessage(result.message);
    });
  }

  async function remove() {
    if (lock.current) return;
    if (
      !window.confirm(
        "Remove the factory profile PDF?\n\nThe download buttons disappear from the Own Factory section straight away.",
      )
    ) {
      return;
    }
    await perform("remove", async () => {
      const result = await request("/api/machinery/factory-pdf", "PATCH", {
        pdf: null,
      });
      setSaved(result.pdf ?? null);
      setStaged(null);
      setMessage(result.message);
    });
  }

  function discard() {
    setStaged(null);
    setError("");
    setMessage("");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          Factory profile PDF
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          The document behind the two download buttons in the Own Factory section of
          the Factory &amp; Machinery page. It is stored in Cloudinary and recorded
          in the database, so replacing it needs no redeploy.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={save}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div
          className={`rounded-xl border p-4 ${
            dirty ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-sm font-semibold text-slate-900">
            {current ? "Document in place" : "No document published"}
          </p>
          {current ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-800"
              >
                <FileText className="size-4" aria-hidden="true" />
                {current.fileName}
              </a>
              {dirty ? (
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                  Not saved yet
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Until a PDF is saved, the Own Factory section shows no download
              buttons.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pdf" className="text-sm font-semibold text-slate-800">
            Upload a new PDF
          </label>
          <input
            id="pdf"
            type="file"
            accept={FACTORY_PDF_ACCEPT}
            onChange={upload}
            disabled={busy}
            className="mt-2 block w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
          <p className="mt-2 text-sm text-slate-600">
            PDF only, {formatBytes(MAX_FACTORY_PDF_BYTES)} at most. The file is
            checked before it is stored, and a new upload is not published until
            you save it.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || !dirty}
            className={primaryClass}
          >
            {phase === "save"
              ? "Saving…"
              : dirty
                ? "Save document"
                : "No changes to save"}
          </button>
          <button
            type="button"
            onClick={discard}
            disabled={busy || !dirty}
            className={buttonClass}
          >
            Discard upload
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy || !saved}
            className={dangerClass}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove from the page
          </button>
        </div>

        {phase === "upload" ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Upload className="size-4 animate-pulse" aria-hidden="true" />
            Uploading…
          </p>
        ) : null}
      </form>
    </section>
  );
}
