"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/*
 * The pieces every Products editor shares.
 *
 * The three editors are near-identical shells over different records, so the
 * class strings, the request helper, the slug rule and the unsaved-changes guard
 * live here once. They match the machinery editors exactly, so a Products screen
 * is visually indistinguishable from the rest of the admin.
 */

export const inputClass =
  "mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export const selectClass = inputClass;

export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryClass = buttonClass
  .replace("border-slate-300 bg-white", "border-blue-600 bg-blue-600")
  .replace("text-slate-700 hover:bg-slate-50", "text-white hover:bg-blue-700");

export const dangerClass = buttonClass
  .replace("border-slate-300 bg-white", "border-red-200 bg-red-50")
  .replace("text-slate-700 hover:bg-slate-50", "text-red-700 hover:bg-red-100");

export const errorClass =
  "rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700";

export const noticeClass =
  "rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800";

/** Matches how a name becomes a URL segment, and what the server expects. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** `true` for a 24-character hex id, which is all the routes accept. */
export function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

/**
 * One JSON/multipart call, with the two failures every editor has to handle the
 * same way: an expired session, and a server error carrying a readable message.
 */
export async function adminRequest<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    ...(body === undefined
      ? {}
      : body instanceof FormData
        ? { body }
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
  });

  const result = (await response
    .json()
    .catch(() => ({ message: "Unexpected server response. Please try again." }))) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session expired. Sign in again."
        : (result.message ?? "The request failed. Please try again."),
    );
  }

  return result;
}

/**
 * The "leave and lose your edits" guard.
 *
 * Both the browser's own unload prompt and a same-page link click are covered, and
 * the click handler runs in the capture phase so it can still stop the
 * navigation before React sees it.
 */
export function useUnsavedChanges(dirty: boolean, busy: boolean) {
  useEffect(() => {
    if (!dirty && !busy) return;

    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || event.defaultPrevented) return;
      if (busy || !window.confirm("Leave this page and discard unsaved changes?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, busy]);
}

/**
 * A single in-flight action at a time.
 *
 * `perform` refuses to start while one is running, which is what stops a double
 * click on Save or Delete from firing two writes, and it funnels every failure
 * into the same error slot the form renders.
 */
export function useActionRunner() {
  const lock = useRef(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
        failure instanceof Error
          ? failure.message
          : "Request failed. Please try again.",
      );
    } finally {
      lock.current = false;
      setPhase("");
    }
  }

  return {
    phase,
    error,
    message,
    busy: phase !== "",
    perform,
    setError: setError as Dispatch<SetStateAction<string>>,
    setMessage: setMessage as Dispatch<SetStateAction<string>>,
    get locked() {
      return lock.current;
    },
  };
}

/** Focuses the editor heading when a form opens, so the change is announced. */
export function useEditorHeading() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ block: "start" });
  }, []);
  return ref;
}

/**
 * The published/hidden switch shared by all three Products editors.
 *
 * A toggle rather than a checkbox, because `isActive` is a state the reader can
 * see on the page rather than a value in a form: the label says which state it
 * is in, so it is readable without relying on the switch's position alone.
 */
export function ActiveToggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-300 bg-white text-slate-600"
      }`}
    >
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
      {checked ? "Published" : "Hidden"}
    </button>
  );
}
