"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  AdminProductCategory,
  ProductCategoryInput,
} from "@/types/products";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import {
  ActiveToggle,
  adminRequest,
  buttonClass,
  dangerClass,
  errorClass,
  inputClass,
  noticeClass,
  primaryClass,
  slugify,
  useActionRunner,
  useEditorHeading,
  useUnsavedChanges,
} from "@/components/admin/editor-ui";

type Draft = ProductCategoryInput & { id: string | null };
type Reply = {
  message: string;
  category?: AdminProductCategory;
  categories?: AdminProductCategory[];
};

function blank(sortOrder: number): Draft {
  return { id: null, name: "", slug: "", sortOrder, isActive: true };
}

function draftOf(record: AdminProductCategory): Draft {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

function ordered(records: AdminProductCategory[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

export default function ProductCategoriesEditor({
  initialCategories,
}: {
  initialCategories: AdminProductCategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(() => blank(0));
  const [baseline, setBaseline] = useState(() => JSON.stringify(blank(0)));
  const [pendingDelete, setPendingDelete] = useState<AdminProductCategory | null>(null);
  const runner = useActionRunner();
  const editorHeading = useEditorHeading();

  const dirty = mode !== "list" && JSON.stringify(draft) !== baseline;
  const { phase, busy, error, message, perform } = runner;

  useUnsavedChanges(dirty, busy);

  function canAbandon() {
    return !runner.locked && (!dirty || window.confirm("Discard unsaved changes?"));
  }

  function openEditor(record?: AdminProductCategory) {
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
    runner.setError("");
    runner.setMessage("");
    requestAnimationFrame(() => {
      editorHeading.current?.focus();
      editorHeading.current?.scrollIntoView({ block: "start" });
    });
  }

  function closeEditor() {
    if (!canAbandon()) return;
    setMode("list");
    runner.setError("");
    runner.setMessage("");
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (runner.locked || !form.reportValidity()) return;

    const { id, ...fields } = draft;
    await perform("save", async () => {
      const result = await adminRequest<Reply>(
        id ? `/api/products/categories/${id}` : "/api/products/categories",
        id ? "PATCH" : "POST",
        fields,
      );
      setCategories((current) =>
        result.category
          ? ordered([
              ...current.filter((item) => item.id !== result.category!.id),
              result.category!,
            ])
          : current,
      );
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
        `/api/products/categories/${record.id}`,
        "DELETE",
      );
      setCategories((current) => current.filter((item) => item.id !== record.id));
      runner.setMessage(result.message);
    });
  }

  async function move(record: AdminProductCategory, direction: -1 | 1) {
    if (runner.locked) return;
    const list = ordered(categories);
    const index = list.findIndex((item) => item.id === record.id);
    const target = index + direction;
    // The server is sent the whole list, because it only accepts a reorder that
    // covers every category exactly once.
    if (index < 0 || target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];

    await perform(`move-${record.id}`, async () => {
      const result = await adminRequest<Reply>("/api/products/categories/order", "PUT", {
        ids: next.map((item) => item.id),
      });
      setCategories(
        result.categories
          ? ordered(result.categories)
          : next.map((item, position) => ({ ...item, sortOrder: position })),
      );
      runner.setMessage(result.message);
    });
  }

  const list = ordered(categories);
  const productTotal = list.reduce((sum, item) => sum + item.productCount, 0);

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

        <form
          onSubmit={save}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
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
              maxLength={120}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              The heading printed above this category&apos;s products on the
              buying house page.
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
              Lowercase letters, numbers and single hyphens only.
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

          <div>
            <span className="text-sm font-semibold text-slate-800">Visibility</span>
            <div className="mt-2">
              <ActiveToggle
                id="category-active"
                checked={draft.isActive}
                onChange={(isActive) => setDraft((current) => ({ ...current, isActive }))}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A hidden category is removed from the page. Its subcategories and
              products are kept and come back when it is shown again.
            </p>
          </div>

          {error ? (
            <p role="alert" className={errorClass}>
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
            Product categories
          </h1>
          <p className="mt-2 text-slate-600">
            {list.length} categor{list.length === 1 ? "y" : "ies"} ·{" "}
            {productTotal} product{productTotal === 1 ? "" : "s"} in total. These
            are the top-level headings on the buying house page, in the order shown
            here.
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
        <p role="alert" className={errorClass}>
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className={noticeClass}>
          {message}
        </p>
      ) : null}

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No categories yet. Add one to start grouping the product catalogue.
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
                  {record.subcategoryCount} subcategor
                  {record.subcategoryCount === 1 ? "y" : "ies"} ·{" "}
                  {record.productCount} product{record.productCount === 1 ? "" : "s"}
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
                  href={`/admin/products/subcategories?categoryId=${record.id}`}
                  className={buttonClass}
                >
                  Subcategories
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
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name}"?`}
        description={
          pendingDelete && (
            <>
              <p>
                Deleting this category also deletes everything inside it. This
                cannot be undone.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>
                  {pendingDelete.subcategoryCount} subcategor
                  {pendingDelete.subcategoryCount === 1 ? "y" : "ies"}
                </li>
                <li>
                  {pendingDelete.productCount} product
                  {pendingDelete.productCount === 1 ? "" : "s"}
                </li>
              </ul>
            </>
          )
        }
        confirmLabel="Delete everything"
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
