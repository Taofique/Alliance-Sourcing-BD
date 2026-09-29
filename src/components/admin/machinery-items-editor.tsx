"use client";

import { useEffect, useMemo, useRef, useState, type SubmitEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  AdminMachineryCategory,
  AdminMachineryItem,
  MachineryItemInput,
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

const PAGE_SIZE = 10;

type Draft = MachineryItemInput & { id: string | null };
type Reply = {
  message: string;
  item?: AdminMachineryItem;
  items?: AdminMachineryItem[];
};

function blank(categoryId: string, sortOrder: number): Draft {
  return { id: null, categoryId, slNo: sortOrder + 1, machineName: "", brand: "", quantity: 0, sortOrder };
}

function draftOf(record: AdminMachineryItem): Draft {
  return {
    id: record.id,
    categoryId: record.categoryId,
    slNo: record.slNo,
    machineName: record.machineName,
    brand: record.brand ?? "",
    quantity: record.quantity,
    sortOrder: record.sortOrder,
  };
}

function ordered(records: AdminMachineryItem[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.slNo - b.slNo ||
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

export default function MachineryItemsEditor({
  initialItems,
  categories,
  initialCategoryId = "all",
}: {
  initialItems: AdminMachineryItem[];
  categories: AdminMachineryCategory[];
  initialCategoryId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [baseline, setBaseline] = useState("");
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const editorHeading = useRef<HTMLHeadingElement>(null);

  const dirty = mode !== "list" && draft !== null && JSON.stringify(draft) !== baseline;
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

  /*
   * Filtering and paging happen here rather than on the server: the full list
   * is 25 rows today, and a client that can page and search without a round trip
   * is what makes a quantity quick to correct.
   */
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return ordered(items).filter((item) => {
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
      if (!needle) return true;
      return (
        item.machineName.toLowerCase().includes(needle) ||
        (item.brand ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, categoryFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const filteredTotal = filtered.reduce((sum, item) => sum + item.quantity, 0);

  function resetListing(nextCategory: string) {
    setCategoryFilter(nextCategory);
    setSearch("");
    setPage(1);
  }

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

  function openEditor(record?: AdminMachineryItem) {
    if (!canAbandon()) return;
    let next: Draft;
    if (record) {
      next = draftOf(record);
    } else {
      // A new machine belongs in the category being looked at, at the end of it.
      const target =
        categoryFilter === "all" ? (categories[0]?.id ?? "") : categoryFilter;
      const siblings = ordered(items.filter((item) => item.categoryId === target));
      next = blank(target, siblings.length);
    }
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
    setDraft(null);
    setError("");
    setMessage("");
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (lock.current || !form.reportValidity() || !draft) return;

    const { id, ...fields } = draft;
    await perform("save", async () => {
      const result = id
        ? await request(`/api/machinery/items/${id}`, "PATCH", fields)
        : await request("/api/machinery/items", "POST", fields);
      if (result.item) {
        setItems((current) => [
          ...current.filter((item) => item.id !== result.item!.id),
          result.item!,
        ]);
      }
      setMode("list");
      setDraft(null);
      setMessage(result.message);
    });
  }

  async function remove(record: AdminMachineryItem) {
    if (lock.current) return;
    if (
      !window.confirm(
        `Delete "${record.machineName}"?\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }
    await perform(`delete-${record.id}`, async () => {
      await request(`/api/machinery/items/${record.id}`, "DELETE");
      setItems((current) => current.filter((item) => item.id !== record.id));
      setMessage(`"${record.machineName}" was deleted.`);
    });
  }

  async function move(record: AdminMachineryItem, direction: -1 | 1) {
    if (lock.current) return;
    // A reorder is only meaningful inside one category, so the list sent to the
    // server is always that category's full membership.
    const siblings = ordered(items.filter((item) => item.categoryId === record.categoryId));
    const index = siblings.findIndex((item) => item.id === record.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const next = [...siblings];
    [next[index], next[target]] = [next[target], next[index]];

    await perform(`move-${record.id}`, async () => {
      const result = await request("/api/machinery/items/order", "PUT", {
        categoryId: record.categoryId,
        ids: next.map((item) => item.id),
      });
      if (result.items) {
        const returned = new Map(result.items.map((item) => [item.id, item]));
        setItems((current) =>
          current.map((item) => returned.get(item.id) ?? item),
        );
      } else {
        setItems((current) =>
          current.map((item) => {
            const position = next.findIndex((entry) => entry.id === item.id);
            return position < 0
              ? item
              : { ...item, sortOrder: position, slNo: position + 1 };
          }),
        );
      }
      setMessage(result.message);
    });
  }

  if (mode !== "list" && draft) {
    return (
      <section className="space-y-6">
        <div>
          <button type="button" onClick={closeEditor} className={buttonClass}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to machines
          </button>
        </div>

        <h1
          ref={editorHeading}
          tabIndex={-1}
          className="font-heading text-2xl font-bold text-slate-900 outline-none sm:text-3xl"
        >
          {mode === "create" ? "New machine" : `Edit ${draft.machineName || "machine"}`}
        </h1>

        <form onSubmit={save} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <label htmlFor="categoryId" className="text-sm font-semibold text-slate-800">
              Category
            </label>
            <select
              id="categoryId"
              value={draft.categoryId}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, categoryId: event.target.value } : current,
                )
              }
              required
              className={inputClass}
            >
              {categories.length === 0 ? (
                <option value="">No categories yet</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
            <p className="mt-2 text-sm text-slate-600">
              The table this machine is printed in. Moving it puts it at the end of
              the new table.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="machineName" className="text-sm font-semibold text-slate-800">
                Machine name
              </label>
              <input
                id="machineName"
                value={draft.machineName}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, machineName: event.target.value } : current,
                  )
                }
                required
                maxLength={120}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="brand" className="text-sm font-semibold text-slate-800">
                Brand
              </label>
              <input
                id="brand"
                value={draft.brand ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, brand: event.target.value } : current,
                  )
                }
                maxLength={80}
                className={inputClass}
              />
              <p className="mt-2 text-sm text-slate-600">
                Leave empty to print a blank cell, exactly as the table shows.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="quantity" className="text-sm font-semibold text-slate-800">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                value={draft.quantity}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, quantity: Number(event.target.value) }
                      : current,
                  )
                }
                required
                min={0}
                max={1000000}
                step={1}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="slNo" className="text-sm font-semibold text-slate-800">
                Row number
              </label>
              <input
                id="slNo"
                type="number"
                value={draft.slNo}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, slNo: Number(event.target.value) } : current,
                  )
                }
                required
                min={1}
                max={9999}
                step={1}
                className={inputClass}
              />
              <p className="mt-2 text-sm text-slate-600">
                The &ldquo;No&rdquo; column. Reordering renumbers these automatically.
              </p>
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={primaryClass}>
              {phase === "save" ? "Saving…" : "Save machine"}
            </button>
            <button type="button" onClick={closeEditor} disabled={busy} className={buttonClass}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  const categoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? "Unknown";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Machines
          </h1>
          <p className="mt-2 text-slate-600">
            {filtered.length} of {items.length} machine{items.length === 1 ? "" : "s"} shown ·{" "}
            {filteredTotal.toLocaleString()} units. Every quantity here is what the
            public table and its totals print.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          disabled={busy || categories.length === 0}
          className={primaryClass}
        >
          <Plus className="size-4" aria-hidden="true" />
          New machine
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Add a category first — a machine has to belong to one.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <div className="min-w-56 flex-1">
          <label htmlFor="filter" className="text-sm font-semibold text-slate-800">
            Category
          </label>
          <select
            id="filter"
            value={categoryFilter}
            onChange={(event) => resetListing(event.target.value)}
            className={inputClass}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-56 flex-1">
          <label htmlFor="search" className="text-sm font-semibold text-slate-800">
            Search
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Machine name or brand"
            className={inputClass}
          />
        </div>
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

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          {items.length === 0
            ? "No machines yet. Add one to fill the public table."
            : "No machines match this search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Machines, with the quantity each contributes to the published totals
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">No.</th>
                <th scope="col" className="px-4 py-3 font-semibold">Machine</th>
                <th scope="col" className="px-4 py-3 font-semibold">Brand</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Qty</th>
                <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((record) => {
                const siblings = ordered(
                  items.filter((item) => item.categoryId === record.categoryId),
                );
                const position = siblings.findIndex((item) => item.id === record.id);
                return (
                  <tr key={record.id}>
                    <td className="px-4 py-3 tabular-nums text-slate-500">{record.slNo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {record.machineName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.brand || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {record.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {categoryName(record.categoryId)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => move(record, -1)}
                          disabled={busy || position === 0}
                          aria-label={`Move ${record.machineName} up`}
                          className={buttonClass}
                        >
                          <ArrowUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(record, 1)}
                          disabled={busy || position === siblings.length - 1}
                          aria-label={`Move ${record.machineName} down`}
                          className={buttonClass}
                        >
                          <ArrowDown className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditor(record)}
                          disabled={busy}
                          className={buttonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(record)}
                          disabled={busy}
                          aria-label={`Delete ${record.machineName}`}
                          className={dangerClass}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav
          aria-label="Machines pages"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-slate-600">
            Page {safePage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage === 1}
              className={buttonClass}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              disabled={safePage === pageCount}
              className={buttonClass}
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
