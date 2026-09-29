"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  AdminProduct,
  AdminProductCategory,
  AdminProductSubcategory,
  ProductImage,
  ProductInput,
} from "@/types/products";
import { MAX_PRODUCT_BYTES } from "@/lib/product-upload-limits";
import { PRODUCT_IMAGE_ACCEPT } from "@/lib/validations/products";
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
  useActionRunner,
  useUnsavedChanges,
} from "@/components/admin/editor-ui";

type Draft = ProductInput & { id: string | null };
type Reply = {
  message: string;
  product?: AdminProduct;
  products?: AdminProduct[];
  image?: ProductImage;
};

function blank(subcategoryId: string, sortOrder: number): Draft {
  return {
    id: null,
    subcategoryId,
    name: "",
    image: { url: "", publicId: "" },
    sortOrder,
    isActive: true,
  };
}

function draftOf(record: AdminProduct): Draft {
  return {
    id: record.id,
    subcategoryId: record.subcategoryId,
    name: record.name,
    image: record.image,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

function ordered(records: AdminProduct[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

export default function ProductItemsEditor({
  initialProducts,
  initialSubcategories,
  initialCategories,
  initialSubcategoryId,
}: {
  initialProducts: AdminProduct[];
  initialSubcategories: AdminProductSubcategory[];
  initialCategories: AdminProductCategory[];
  initialSubcategoryId: string;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [subcategories] = useState(initialSubcategories);
  const [categories] = useState(initialCategories);
  const [filter, setFilter] = useState(
    isObjectId(initialSubcategoryId) ? initialSubcategoryId : "",
  );
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(() => blank(filter, 0));
  const [baseline, setBaseline] = useState(() => JSON.stringify(blank(filter, 0)));
  /**
   * A freshly uploaded image, held separately from the draft.
   *
   * The upload lands in Cloudinary immediately but is not attached to the record
   * until the form is saved, so a failed or abandoned edit cannot silently
   * replace a product's photograph.
   */
  const [uploaded, setUploaded] = useState<ProductImage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const runner = useActionRunner();

  const dirty =
    mode !== "list" && (JSON.stringify(draft) !== baseline || uploaded !== null);
  const { phase, busy, error, message, perform } = runner;

  useUnsavedChanges(dirty, busy);

  const nameBySubcategory = new Map(
    subcategories.map((entry) => [entry.id, entry.name]),
  );

  const visible = filter
    ? products.filter((record) => record.subcategoryId === filter)
    : products;

  function nextSortOrder(parentId: string) {
    const siblings = products.filter((record) => record.subcategoryId === parentId);
    return Math.min(9999, Math.max(-1, ...siblings.map((item) => item.sortOrder)) + 1);
  }

  function openEditor(record?: AdminProduct) {
    if (runner.locked || (dirty && !window.confirm("Discard unsaved changes?"))) {
      return;
    }
    const parentId = record?.subcategoryId ?? (filter || subcategories[0]?.id || "");
    const next = record ? draftOf(record) : blank(parentId, nextSortOrder(parentId));
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setUploaded(null);
    setMode(record ? "edit" : "create");
    runner.setError("");
    runner.setMessage("");
  }

  function closeEditor() {
    if (runner.locked || (dirty && !window.confirm("Discard unsaved changes?"))) {
      return;
    }
    setMode("list");
    setUploaded(null);
    runner.setError("");
    runner.setMessage("");
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || runner.locked) return;

    if (file.size > MAX_PRODUCT_BYTES) {
      runner.setError("The image must be 2 MiB or smaller.");
      input.value = "";
      return;
    }

    await perform("upload", async () => {
      const form = new FormData();
      form.append("file", file);
      const result = await adminRequest<Reply>(
        "/api/products/items/upload",
        "POST",
        form,
      );
      if (!result.image) throw new Error("Upload returned no image. Try again.");
      setUploaded(result.image);
      runner.setMessage("Image uploaded. Save the product to apply it.");
    });
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (runner.locked || !form.reportValidity()) return;

    const { id, image: storedImage, ...fields } = draft;
    void storedImage;

    // A new product has no photograph until one is uploaded, and the form's own
    // required field covers that case, so this only guards the API contract.
    const image = uploaded ?? draft.image;
    if (!image?.url) {
      runner.setError("Upload a product photograph before saving.");
      return;
    }

    const previousParent = id
      ? (products.find((record) => record.id === id)?.subcategoryId ?? draft.subcategoryId)
      : draft.subcategoryId;

    await perform("save", async () => {
      const result = await adminRequest<Reply>(
        id ? `/api/products/items/${id}` : "/api/products/items",
        id ? "PATCH" : "POST",
        // The image is only sent when it changed, so a name-only edit reuses the
        // stored photograph instead of re-uploading it.
        { ...fields, ...(uploaded ? { image } : {}) },
      );

      if (previousParent !== draft.subcategoryId) {
        const moved = await adminRequest<Reply>(
          `/api/products/items?subcategoryId=${previousParent}`,
          "GET",
        );
        setProducts((current) => [
          ...current.filter(
            (record) =>
              record.subcategoryId !== previousParent || record.id === id,
          ),
          ...(moved.products ?? []).filter((record) => record.id !== id),
        ]);
      }

      if (result.product) {
        setProducts((current) =>
          ordered([
            ...current.filter((record) => record.id !== result.product!.id),
            result.product!,
          ]),
        );
      }
      setMode("list");
      setUploaded(null);
      runner.setMessage(result.message);
    });
  }

  async function confirmDelete() {
    const record = pendingDelete;
    if (!record) return;
    setPendingDelete(null);

    await perform(`delete-${record.id}`, async () => {
      const result = await adminRequest<Reply>(
        `/api/products/items/${record.id}`,
        "DELETE",
      );
      setProducts((current) => current.filter((item) => item.id !== record.id));
      runner.setMessage(result.message);
    });
  }

  async function move(record: AdminProduct, direction: -1 | 1) {
    if (runner.locked) return;
    const list = ordered(
      products.filter((item) => item.subcategoryId === record.subcategoryId),
    );
    const index = list.findIndex((item) => item.id === record.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];

    await perform(`move-${record.id}`, async () => {
      const result = await adminRequest<Reply>("/api/products/items/order", "PUT", {
        parentId: record.subcategoryId,
        ids: next.map((item) => item.id),
      });
      setProducts((current) => {
        const other = current.filter(
          (item) => item.subcategoryId !== record.subcategoryId,
        );
        return ordered([...other, ...(result.products ?? next)]);
      });
      runner.setMessage(result.message);
    });
  }

  if (mode !== "list") {
    const preview = uploaded?.url ?? draft.image.url;
    const siblings = ordered(
      products.filter((record) => record.subcategoryId === draft.subcategoryId),
    );

    return (
      <section className="space-y-6">
        <div>
          <button type="button" onClick={closeEditor} className={buttonClass}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to products
          </button>
        </div>

        <h1
          tabIndex={-1}
          className="font-heading text-2xl font-bold text-slate-900 outline-none sm:text-3xl"
        >
          {mode === "create" ? "New product" : `Edit ${draft.name || "product"}`}
        </h1>

        <form
          onSubmit={save}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div>
            <label htmlFor="subcategoryId" className="text-sm font-semibold text-slate-800">
              Subcategory
            </label>
            <select
              id="subcategoryId"
              value={draft.subcategoryId}
              onChange={(event) => {
                const subcategoryId = event.target.value;
                setDraft((current) => ({
                  ...current,
                  subcategoryId,
                  sortOrder: nextSortOrder(subcategoryId),
                }));
              }}
              required
              className={selectClass}
            >
              <option value="">Choose a subcategory…</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {subcategories
                    .filter((entry) => entry.categoryId === category.id)
                    .map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name} ({entry.productCount})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-600">
              Where this garment is filed on the buying house page.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="text-sm font-semibold text-slate-800">
              Product name
            </label>
            <input
              id="name"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              required
              maxLength={160}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-slate-600">
              The caption printed under the photograph. Names may repeat — several
              products in the catalogue are deliberately the same style in
              different colours.
            </p>
          </div>

          {/*
            The photograph is required for a new product and optional on an edit,
            which is enforced by `required` on the input only when there is no
            stored image. A name-only edit never has to re-upload anything.
          */}
          <div>
            <label htmlFor="image" className="text-sm font-semibold text-slate-800">
              Photograph
            </label>
            <input
              id="image"
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              onChange={upload}
              required={!draft.id && !uploaded}
              className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium"
            />
            <p className="mt-2 text-xs text-slate-600">
              Maximum 2 MiB. JPG, PNG, WebP, AVIF or SVG. The card crops to a 4:5
              portrait frame, so a portrait photograph fills it best. Upload first,
              then save — text-only edits keep the saved photograph.
            </p>

            {preview ? (
              <div className="mt-4 flex flex-wrap items-start gap-4">
                <Image
                  src={preview}
                  alt={
                    draft.name
                      ? `Photograph preview for ${draft.name}`
                      : "Product photograph preview"
                  }
                  width={160}
                  height={200}
                  className="w-40 rounded-lg border border-slate-200 object-cover"
                />
                <div className="space-y-2">
                  {uploaded ? (
                    <p className="text-sm font-medium text-blue-700">
                      New photograph uploaded. Save the product to apply it.
                    </p>
                  ) : null}
                  {uploaded ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUploaded(null);
                        setDraft((current) =>
                          current.id
                            ? current
                            : { ...current, image: { url: "", publicId: "" } },
                        );
                      }}
                      className={buttonClass}
                    >
                      Discard uploaded photograph
                    </button>
                  ) : draft.id ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          image: { url: "", publicId: "" },
                        }))
                      }
                      className={buttonClass}
                    >
                      Remove photograph on save
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
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
              Lower numbers appear first, and only among {siblings.length} product
              {siblings.length === 1 ? "" : "s"} in{" "}
              {nameBySubcategory.get(draft.subcategoryId) ?? "this subcategory"}.
            </p>
          </div>

          <div>
            <span className="text-sm font-semibold text-slate-800">Visibility</span>
            <div className="mt-2">
              <ActiveToggle
                id="product-active"
                checked={draft.isActive}
                onChange={(isActive) => setDraft((current) => ({ ...current, isActive }))}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A hidden product is removed from the page. If it was the last one in
              its subcategory, that subcategory is hidden too.
            </p>
          </div>

          {error ? (
            <p role="alert" className={errorClass}>
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={primaryClass}>
              {phase === "save" ? "Saving…" : "Save product"}
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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Products
          </h1>
          <p className="mt-2 text-slate-600">
            {list.length} product{list.length === 1 ? "" : "s"} shown here. These
            are the garment cards on the buying house page, in the order they
            appear.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="subcategory-filter"
              className="text-sm font-semibold text-slate-800"
            >
              Filter by subcategory
            </label>
            <select
              id="subcategory-filter"
              value={filter}
              onChange={(event) => {
                const next = event.target.value;
                setFilter(next);
                router.replace(
                  next
                    ? `/admin/products/items?subcategoryId=${next}`
                    : "/admin/products/items",
                );
              }}
              className={selectClass}
            >
              <option value="">All subcategories</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {subcategories
                    .filter((entry) => entry.categoryId === category.id)
                    .map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name} ({entry.productCount})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => openEditor()}
            disabled={busy || subcategories.length === 0}
            className={primaryClass}
          >
            <Plus className="size-4" aria-hidden="true" />
            New product
          </button>
        </div>
      </div>

      {subcategories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Add a category and a subcategory first — every product belongs to one.
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

      {subcategories.length > 0 && list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No products in this subcategory yet. Add one to start filling its grid.
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
                <div className="flex min-w-0 items-center gap-4">
                  <Image
                    src={record.image.url}
                    alt={record.name}
                    width={80}
                    height={100}
                    className="size-20 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-heading text-lg font-bold text-slate-900">
                      {record.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {record.categoryName} / {record.subcategoryName}
                      {!record.isActive ? " · hidden" : ""}
                    </p>
                  </div>
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
            <p>
              This removes the product from {pendingDelete.categoryName} /{" "}
              {pendingDelete.subcategoryName}. This cannot be undone.
            </p>
          )
        }
        confirmLabel="Delete product"
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <p className="text-sm text-slate-600">
        <Link href="/admin/products/subcategories" className="underline">
          Manage subcategories
        </Link>{" "}
        or{" "}
        <Link href="/admin/products/categories" className="underline">
          manage categories
        </Link>
        .
      </p>
    </section>
  );
}
