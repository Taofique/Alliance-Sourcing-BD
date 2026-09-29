"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  AdminProductCategory,
  AdminProductSubcategory,
  ProductSubcategoryInput,
} from "@/types/products";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import {
  ActiveToggle,
  adminRequest,
  buttonClass,
  dangerClass,
  errorClass,
  inputClass,
  isObjectId,
  noticeClass,
  primaryClass,
  selectClass,
  slugify,
  useActionRunner,
  useUnsavedChanges,
} from "@/components/admin/editor-ui";

type Draft = ProductSubcategoryInput & { id: string | null };
type Reply = {
  message: string;
  subcategory?: AdminProductSubcategory;
  subcategories?: AdminProductSubcategory[];
};

function blank(categoryId: string, sortOrder: number): Draft {
  return { id: null, categoryId, name: "", slug: "", sortOrder, isActive: true };
}

function draftOf(record: AdminProductSubcategory): Draft {
  return {
    id: record.id,
    categoryId: record.categoryId,
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

function ordered(records: AdminProductSubcategory[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

export default function ProductSubcategoriesEditor({
  initialSubcategories,
  initialCategories,
  initialCategoryId,
}: {
  initialSubcategories: AdminProductSubcategory[];
  initialCategories: AdminProductCategory[];
  initialCategoryId: string;
}) {
  const router = useRouter();
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [categories] = useState(initialCategories);
  // The active filter: "" means every category, which is what the page shows
  // when it is opened from the sidebar rather than from a category row.
  const [filter, setFilter] = useState(
    isObjectId(initialCategoryId) ? initialCategoryId : "",
  );
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(() => blank(filter, 0));
  const [baseline, setBaseline] = useState(() => JSON.stringify(blank(filter, 0)));
  const [pendingDelete, setPendingDelete] = useState<AdminProductSubcategory | null>(null);
  const runner = useActionRunner();

  const dirty = mode !== "list" && JSON.stringify(draft) !== baseline;
  const { phase, busy, error, message, perform } = runner;

  useUnsavedChanges(dirty, busy);

  const nameByCategory = new Map(categories.map((entry) => [entry.id, entry.name]));

  const visible = filter
    ? subcategories.filter((record) => record.categoryId === filter)
    : subcategories;

  function nextSortOrder(parentId: string) {
    const siblings = subcategories.filter((record) => record.categoryId === parentId);
    return Math.min(9999, Math.max(-1, ...siblings.map((item) => item.sortOrder)) + 1);
  }

  function openEditor(record?: AdminProductSubcategory) {
    if (runner.locked || (dirty && !window.confirm("Discard unsaved changes?"))) {
      return;
    }
    const parentId = record?.categoryId ?? (filter || categories[0]?.id || "");
    const next = record ? draftOf(record) : blank(parentId, nextSortOrder(parentId));
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setMode(record ? "edit" : "create");
    runner.setError("");
    runner.setMessage("");
  }

  function closeEditor() {
    if (runner.locked || (dirty && !window.confirm("Discard unsaved changes?"))) {
      return;
    }
    setMode("list");
    runner.setError("");
    runner.setMessage("");
  }

  /** Re-reads one category's list after a write, so the counts stay truthful. */
  async function refresh(parentId: string) {
    const result = await adminRequest<Reply>(
      `/api/products/subcategories?categoryId=${parentId}`,
      "GET",
    );
    setSubcategories((current) => {
      const other = current.filter((record) => record.categoryId !== parentId);
      return ordered([...other, ...(result.subcategories ?? [])]);
    });
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (runner.locked || !form.reportValidity()) return;

    const { id, ...fields } = draft;
    const previousParent = id
      ? (subcategories.find((record) => record.id === id)?.categoryId ?? draft.categoryId)
      : draft.categoryId;

    await perform("save", async () => {
      const result = await adminRequest<Reply>(
        id ? `/api/products/subcategories/${id}` : "/api/products/subcategories",
        id ? "PATCH" : "POST",
        fields,
      );
      if (previousParent !== draft.categoryId) await refresh(previousParent);
      if (result.subcategory) {
        setSubcategories((current) =>
          ordered([
            ...current.filter((record) => record.id !== result.subcategory!.id),
            result.subcategory!,
          ]),
        );
      }
      setMode("list");
      runner.setMessage(result.message);
    });
  }

  async function confirmDelete() {
    const record = pendingDelete;
    if (!record) return;
    setPendingDelete(null);

    await perform(`delete-${record.id}`, async () => {
      const result = await adminRequest<Reply>(
        `/api/products/subcategories/${record.id}`,
        "DELETE",
      );
      setSubcategories((current) => current.filter((item) => item.id !== record.id));
      runner.setMessage(result.message);
    });
  }

  async function move(record: AdminProductSubcategory, direction: -1 | 1) {
    if (runner.locked) return;
    const list = ordered(
      subcategories.filter((item) => item.categoryId === record.categoryId),
    );
    const index = list.findIndex((item) => item.id === record.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];

    await perform(`move-${record.id}`, async () => {
      const result = await adminRequest<Reply>("/api/products/subcategories/order", "PUT", {
        parentId: record.categoryId,
        ids: next.map((item) => item.id),
      });
      setSubcategories((current) => {
        const other = current.filter((item) => item.categoryId !== record.categoryId);
        return ordered([...other, ...(result.subcategories ?? next)]);
      });
      runner.setMessage(result.message);
    });
  }

  if (mode !== "list") {
    const editing = mode === "edit" ? draft : null;
    const siblings = ordered(
      subcategories.filter((record) => record.categoryId === draft.categoryId),
    );

    return (
      <section className="space-y-6">
        <div>
          <button type="button" onClick={closeEditor} className={buttonClass}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to subcategories
          </button>
        </div>

        <h1
          tabIndex={-1}
          className="font-heading text-2xl font-bold text-slate-900 outline-none sm:text-3xl"
        >
          {editing ? `Edit ${editing.name || "subcategory"}` : "New subcategory"}
        </h1>

        <form
          onSubmit={save}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div>
            <label htmlFor="categoryId" className="text-sm font-semibold text-slate-800">
              Category
            </label>
            <select
              id="categoryId"
              value={draft.categoryId}
              onChange={(event) => {
                const categoryId = event.target.value;
                setDraft((current) => ({
                  ...current,
                  categoryId,
                  // An order only means something inside one category, so moving
                  // to a new one starts at the end of it.
                  sortOrder: nextSortOrder(categoryId),
                }));
              }}
              required
              className={selectClass}
            >
              <option value="">Choose a category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-600">
              The category this subcategory is filed under on the page.
            </p>
          </div>

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
                  slug:
                    current.id || current.slug !== slugify(current.name)
                      ? current.slug
                      : slugify(name),
                }));
              }}
              required
              maxLength={120}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              The heading printed above this subcategory&apos;s grid.
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
                setDraft((current) => ({
                  ...current,
                  slug: slugify(event.target.value),
                }))
              }
              required
              maxLength={120}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Use lowercase letters, numbers and single hyphens."
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              Lowercase letters, numbers and single hyphens only. Only has to be
              unique inside its own category.
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
              Lower numbers appear first, and only among{" "}
              {siblings.length} subcategor{siblings.length === 1 ? "y" : "ies"} in{" "}
              {nameByCategory.get(draft.categoryId) ?? "this category"}.
            </p>
          </div>

          <div>
            <span className="text-sm font-semibold text-slate-800">Visibility</span>
            <div className="mt-2">
              <ActiveToggle
                id="subcategory-active"
                checked={draft.isActive}
                onChange={(isActive) => setDraft((current) => ({ ...current, isActive }))}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A hidden subcategory is removed from the page. Its products are kept
              and come back when it is shown again.
            </p>
          </div>

          {error ? (
            <p role="alert" className={errorClass}>
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={primaryClass}>
              {phase === "save" ? "Saving…" : "Save subcategory"}
            </button>
            <button type="button" onClick={closeEditor} disabled={busy} className={buttonClass}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  const list = ordered(visible);
  const productTotal = list.reduce((sum, item) => sum + item.productCount, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Product subcategories
          </h1>
          <p className="mt-2 text-slate-600">
            {list.length} subcategor{list.length === 1 ? "y" : "ies"} ·{" "}
            {productTotal} product{productTotal === 1 ? "" : "s"} in total. These are
            the grouped headings inside each category on the buying house page.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="category-filter"
              className="text-sm font-semibold text-slate-800"
            >
              Filter by category
            </label>
            <select
              id="category-filter"
              value={filter}
              onChange={(event) => {
                const next = event.target.value;
                setFilter(next);
                // The filter lives in the URL so the view survives a reload and
                // can be linked to from the categories screen.
                router.replace(
                  next ? `/admin/products/subcategories?categoryId=${next}` : "/admin/products/subcategories",
                );
              }}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => openEditor()}
            disabled={busy || categories.length === 0}
            className={primaryClass}
          >
            <Plus className="size-4" aria-hidden="true" />
            New subcategory
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Add a category first — every subcategory belongs to one.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className={noticeClass}>
          {message}
        </p>
      ) : null}

      {categories.length > 0 && list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No subcategories in this category yet. Add one to start grouping its
          products.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((record) => {
            const position = list.findIndex((item) => item.id === record.id);
            return (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="min-w-0">
                  <p className="font-heading text-lg font-bold text-slate-900">
                    {record.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {record.categoryName} · {record.productCount} product
                    {record.productCount === 1 ? "" : "s"}
                    {!record.isActive ? " · hidden" : ""}
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
                      disabled={busy || position === 0}
                      aria-label={`Move ${record.name} up`}
                      className={buttonClass}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(record, 1)}
                      disabled={busy || position === list.length - 1}
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
                    href={`/admin/products/items?subcategoryId=${record.id}`}
                    className={buttonClass}
                  >
                    Products
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(record)}
                    disabled={busy}
                    className={dangerClass}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name}"?`}
        description={
          pendingDelete && (
            <>
              <p>
                Deleting this subcategory also deletes the products inside it. This
                cannot be undone.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  From {pendingDelete.categoryName} ·{" "}
                  {pendingDelete.productCount} product
                  {pendingDelete.productCount === 1 ? "" : "s"}
                </li>
              </ul>
            </>
          )
        }
        confirmLabel="Delete with products"
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
