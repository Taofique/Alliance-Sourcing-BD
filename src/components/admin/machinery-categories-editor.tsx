"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  AdminMachineryCategory,
  MachineryCategoryInput,
} from "@/types/machinery";

const inputClass =
  "mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = buttonClass
  .replace("border-slate-300 bg-white", "border-blue-600 bg-blue-600")
  .replace("text-slate-700 hover:bg-slate-50", "text-white hover:bg-blue-700");
const dangerClass = buttonClass
  .replace("border-slate-300 bg-white", "border-red-200 bg-red-50")
  .replace("text-slate-700 hover:bg-slate-50", "text-red-700 hover:bg-red-100");

type Draft = MachineryCategoryInput & { id: string | null };
type Reply = {
  message: string;
  category?: AdminMachineryCategory;
  categories?: AdminMachineryCategory[];
};

/** Matches how a name becomes a URL segment, and what the server expects. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function blank(sortOrder: number): Draft {
  return { id: null, name: "", slug: "", sortOrder };
}

function draftOf(record: AdminMachineryCategory): Draft {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
  };
}

function ordered(records: AdminMachineryCategory[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

async function request(
  url: string,
  method: string,
  body?: unknown,
): Promise<Reply> {
  const response = await fetch(url, {
    method,
    ...(body !== undefined
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

export default function MachineryCategoriesEditor({
  initialCategories,
}: {
  initialCategories: AdminMachineryCategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(() => blank(0));
  const [baseline, setBaseline] = useState(() => JSON.stringify(blank(0)));
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const editorHeading = useRef<HTMLHeadingElement>(null);

  const dirty = mode !== "list" && JSON.stringify(draft) !== baseline;
  const busy = phase !== "";

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

  function canAbandon() {
    return !lock.current && (!dirty || window.confirm("Discard unsaved changes?"));
  }

  function openEditor(record?: AdminMachineryCategory) {
    if (!canAbandon()) return;
    const next = record
      ? draftOf(record)
      : blank(
          Math.min(
            9999,
            Math.max(-1, ...categories.map((item) => item.sortOrder)) + 1,
          ),
        );
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setMode(record ? "edit" : "create");
    setError("");
    setMessage("");
    requestAnimationFrame(() => {
      editorHeading.current?.focus();
      editorHeading.current?.scrollIntoView({ block: "start" });
    });
  }

  function closeEditor() {
    if (!canAbandon()) return;
    setMode("list");
    setError("");
    setMessage("");
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (lock.current || !form.reportValidity()) return;

    const { id, ...fields } = draft;
    await perform("save", async () => {
      const result = id
        ? await request(`/api/machinery/categories/${id}`, "PATCH", fields)
        : await request("/api/machinery/categories", "POST", fields);
      setCategories((current) =>
        result.category
          ? ordered([
              ...current.filter((item) => item.id !== result.category!.id),
              result.category!,
            ])
          : current,
      );
      setMode("list");
      setMessage(result.message);
    });
  }

  async function remove(record: AdminMachineryCategory) {
    if (lock.current) return;
    // The cascade is destructive and invisible afterwards, so it is spelled out
    // with the exact number of machines that will go with it.
    const confirmed = window.confirm(
      record.itemCount > 0
        ? `Delete "${record.name}"?\n\nThis will also delete ${record.itemCount} machine${record.itemCount === 1 ? "" : "s"} in this category. This cannot be undone.`
        : `Delete "${record.name}"?\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;

    await perform(`delete-${record.id}`, async () => {
      await request(`/api/machinery/categories/${record.id}`, "DELETE");
      setCategories((current) => current.filter((item) => item.id !== record.id));
      setMessage(`"${record.name}" and its machines were deleted.`);
    });
  }

  async function move(record: AdminMachineryCategory, direction: -1 | 1) {
    if (lock.current) return;
    const list = ordered(categories);
    const index = list.findIndex((item) => item.id === record.id);
    const target = index + direction;
    // The server is sent the whole list, because it only accepts a reorder
    // that covers every category exactly once.
    if (index < 0 || target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];

    await perform(`move-${record.id}`, async () => {
      const result = await request("/api/machinery/categories/order", "PUT", {
        ids: next.map((item) => item.id),
      });
      setCategories(
        result.categories ? ordered(result.categories) : next.map((item, position) => ({ ...item, sortOrder: position })),
      );
      setMessage(result.message);
    });
  }

  const list = ordered(categories);
  const grandTotal = list.reduce((sum, item) => sum + item.total, 0);

  if (mode !== "list") {
    return (
      <section className="space-y-6">
        <div>
          <button type="button" onClick={closeEditor} className={buttonClass}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to categories
          </button>
        </div>

        <h1
          ref={editorHeading}
          tabIndex={-1}
          className="font-heading text-2xl font-bold text-slate-900 outline-none sm:text-3xl"
        >
          {mode === "create" ? "New category" : `Edit ${draft.name || "category"}`}
        </h1>

        <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-slate-800">
              Name
            </label>
            <input
              id="name"
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                setDraft((current) => ({
                  ...current,
                  name,
                  // The slug is derived live while typing a new category, and
                  // left alone for one that already has a published address.
                  slug:
                    current.id || current.slug !== slugify(current.name)
                      ? current.slug
                      : slugify(name),
                }));
              }}
              required
              maxLength={80}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              The heading printed above this category&apos;s table.
            </p>
          </div>

          <div>
            <label htmlFor="slug" className="text-sm font-semibold text-slate-800">
              Slug
            </label>
            <input
              id="slug"
              value={draft.slug}
              onChange={(event) =>
                setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))
              }
              required
              maxLength={80}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Use lowercase letters, numbers and single hyphens."
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              Used as the table&apos;s anchor link. Lowercase letters, numbers and
              hyphens only.
            </p>
          </div>

          <div>
            <label htmlFor="sortOrder" className="text-sm font-semibold text-slate-800">
              Display order
            </label>
            <input
              id="sortOrder"
              type="number"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
              min={0}
              max={9999}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              Lower numbers appear first. The arrow buttons change this for you.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={primaryClass}>
              {phase === "save" ? "Saving…" : "Save category"}
            </button>
            <button type="button" onClick={closeEditor} disabled={busy} className={buttonClass}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Machinery categories
          </h1>
          <p className="mt-2 text-slate-600">
            {list.length} categor{list.length === 1 ? "y" : "ies"} ·{" "}
            {grandTotal.toLocaleString()} machines in total. These are the groups
            on the Factory &amp; Machinery page, in the order shown here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          disabled={busy}
          className={primaryClass}
        >
          <Plus className="size-4" aria-hidden="true" />
          New category
        </button>
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

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No categories yet. Add one to start grouping the machinery table.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((record, index) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="min-w-0">
                <p className="font-heading text-lg font-bold text-slate-900">
                  {record.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {record.itemCount} machine{record.itemCount === 1 ? "" : "s"} ·{" "}
                  {record.total.toLocaleString()} units
                </p>
                <p className="mt-1 truncate font-mono text-xs text-slate-500">
                  /{record.slug}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(record, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Move ${record.name} up`}
                    className={buttonClass}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(record, 1)}
                    disabled={busy || index === list.length - 1}
                    aria-label={`Move ${record.name} down`}
                    className={buttonClass}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => openEditor(record)}
                  disabled={busy}
                  className={buttonClass}
                >
                  Edit
                </button>
                <Link
                  href={`/admin/machinery/items?categoryId=${record.id}`}
                  className={buttonClass}
                >
                  Machines
                </Link>
                <button
                  type="button"
                  onClick={() => remove(record)}
                  disabled={busy}
                  className={dangerClass}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
