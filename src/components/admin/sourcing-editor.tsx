"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { BANNER_ACCEPT, MAX_BANNER_BYTES } from "@/lib/banner-upload-limits";
import type { AdminSourcingCategory, SourcingCategoryInput, SourcingImage, SourcingSettings } from "@/types/sourcing";

const inputClass = "mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = buttonClass.replace("border-slate-300 bg-white", "border-blue-600 bg-blue-600").replace("text-slate-700 hover:bg-slate-50", "text-white hover:bg-blue-700");
type Draft = SourcingCategoryInput & { id: string | null; imageUrl: string };
type Reply = { message: string; category?: AdminSourcingCategory; categories?: AdminSourcingCategory[]; settings?: SourcingSettings; image?: SourcingImage };
function blank(sortOrder = 0): Draft {
  return { id: null, title: "", description: "", imageAlt: "", imageUrl: "", sortOrder, isPublished: false };
}
function draftOf(record: AdminSourcingCategory): Draft {
  return { id: record.id, title: record.title, description: record.description, imageAlt: record.imageAlt, imageUrl: record.imageUrl, sortOrder: record.sortOrder, isPublished: record.isPublished };
}
function ordered(records: AdminSourcingCategory[]) {
  return [...records].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
async function request(url: string, method: string, body?: unknown): Promise<Reply> {
  const response = await fetch(url, {
    method,
    ...(body instanceof FormData ? { body } : body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({ message: "Unexpected server response. Please try again." })) as Reply;
  if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : result.message);
  return result;
}

export default function SourcingEditor({ initialCategories, initialSettings }: {
  initialCategories: AdminSourcingCategory[];
  initialSettings: SourcingSettings;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(blank);
  const [baseline, setBaseline] = useState(JSON.stringify(blank()));
  const [image, setImage] = useState<SourcingImage | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const categoryDirty = mode !== "list" && (JSON.stringify(draft) !== baseline || image !== null);
  const settingsDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const busy = phase !== "";

  useEffect(() => {
    if (!categoryDirty && !settingsDirty && !busy) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
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
  }, [categoryDirty, settingsDirty, busy]);

  async function perform(action: string, work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setPhase(action);
    setError("");
    setMessage("");
    try { await work(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Request failed. Please try again."); }
    finally { lock.current = false; setPhase(""); }
  }
  function canAbandon() {
    return !lock.current && (!categoryDirty || window.confirm("Discard unsaved category changes?"));
  }
  function openEditor(record?: AdminSourcingCategory) {
    if (!canAbandon()) return;
    const next = record ? draftOf(record) : blank(Math.min(9999, Math.max(-1, ...categories.map(item => item.sortOrder)) + 1));
    setDraft(next); setBaseline(JSON.stringify(next)); setImage(null);
    setMode(record ? "edit" : "create"); setError(""); setMessage("");
    requestAnimationFrame(() => {
      editorHeading.current?.focus();
      editorHeading.current?.scrollIntoView({ block: "start" });
    });
  }
  function closeEditor() {
    if (!canAbandon()) return;
    setMode("list"); setImage(null); setError(""); setMessage("");
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || lock.current) return;
    if (file.size > MAX_BANNER_BYTES) { setError("The image must be 2 MiB or smaller."); input.value = ""; return; }
    await perform("upload", async () => {
      const form = new FormData();
      form.append("file", file);
      const result = await request("/api/sourcing/upload", "POST", form);
      if (!result.image) throw new Error("Upload returned no image. Try again.");
      setImage(result.image);
      setMessage("Image uploaded. Save the category to apply it.");
    });
    input.value = "";
  }
  async function saveCategory(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (lock.current || !form.reportValidity()) return;
    if (!draft.id && !image) { setError("Upload a category photograph before saving."); return; }
    const { id, imageUrl: savedImageUrl, ...fields } = draft;
    void savedImageUrl;
    await perform("save", async () => {
      const result = await request(id ? "/api/sourcing/" + id : "/api/sourcing", id ? "PATCH" : "POST",
        { ...fields, ...(image ? { image } : {}) });
      if (!result.category) throw new Error("Save returned no category. Reload to check its status.");
      const record = result.category;
      setCategories(current => ordered([...current.filter(item => item.id !== record.id), record]));
      const next = draftOf(record);
      setDraft(next); setBaseline(JSON.stringify(next)); setImage(null); setMode("edit");
      setMessage(result.message);
    });
  }
  async function remove(record: AdminSourcingCategory) {
    if (lock.current || !window.confirm('Delete "' + record.title + '"? This cannot be undone.')) return;
    await perform("delete", async () => {
      const result = await request("/api/sourcing/" + record.id, "DELETE");
      setCategories(current => current.filter(item => item.id !== record.id));
      setMessage(result.message);
    });
  }
  async function move(index: number, direction: number) {
    if (lock.current || index + direction < 0 || index + direction >= categories.length) return;
    const next = [...categories];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    await perform("order", async () => {
      const result = await request("/api/sourcing/order", "PUT", { ids: next.map(item => item.id) });
      if (!result.categories) throw new Error("Reload to check the new order.");
      setCategories(result.categories);
      setMessage(result.message);
    });
  }
  async function saveSettings(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (lock.current || !form.reportValidity()) return;
    await perform("settings", async () => {
      const result = await request("/api/sourcing/settings", "PUT", settings);
      if (!result.settings) throw new Error("Reload to check the saved settings.");
      setSettings(result.settings); setSavedSettings(result.settings); setMessage(result.message);
    });
  }
  const preview = image?.imageUrl ?? draft.imageUrl;

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">What we source</h1>
          <p className="mt-2 text-sm text-slate-600">Manage homepage category photographs, content, publication and display order.</p>
        </div>
        {mode === "list" ? (
          <button type="button" className={primaryClass} disabled={busy} onClick={() => openEditor()}><Plus size={18} aria-hidden="true" />New category</button>
        ) : (
          <button type="button" className={buttonClass} disabled={busy} onClick={closeEditor}><ArrowLeft size={18} aria-hidden="true" />Back to categories</button>
        )}
      </header>
      <div className="sticky top-4 z-30 space-y-2" aria-live="polite">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}
        {busy && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">{phase === "upload" ? "Uploading photograph. The saved image remains unchanged." : "Saving changes…"}</p>}
      </div>

      {mode === "list" ? (
        <section aria-label="Categories" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {categories.length === 0 ? (
            <p className="p-6 text-slate-600">No categories yet. Create a category, or run the sourcing initialization command to add the four reference categories.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {categories.map((record, index) => (
                <li key={record.id} className="flex flex-wrap items-center gap-4 p-5">
                  <Image src={record.imageUrl} alt={record.imageAlt} width={80} height={80} className="size-20 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1 basis-40">
                    <h2 className="font-semibold text-slate-900">{record.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{record.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-600">{record.isPublished ? "Published" : "Draft"} · Order {record.sortOrder}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass} disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label={"Move " + record.title + " up"}><ArrowUp size={18} /></button>
                    <button type="button" className={buttonClass} disabled={busy || index === categories.length - 1} onClick={() => move(index, 1)} aria-label={"Move " + record.title + " down"}><ArrowDown size={18} /></button>
                    <button type="button" className={buttonClass} disabled={busy} onClick={() => openEditor(record)}>Edit<span className="sr-only"> {record.title}</span></button>
                    <button type="button" className={buttonClass + " text-red-700"} disabled={busy} onClick={() => remove(record)} aria-label={"Delete " + record.title}><Trash2 size={18} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <form onSubmit={saveCategory} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-busy={busy}>
          <h2 ref={editorHeading} tabIndex={-1} className="mb-5 scroll-mt-24 text-xl font-semibold text-slate-900">{mode === "create" ? "New category" : "Edit category"}</h2>
          <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-800">Title
                <input required maxLength={160} className={inputClass} value={draft.title} onChange={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, title: value })); }} />
              </label>
              <label className="block text-sm font-medium text-slate-800">Display order
                <input type="number" required min={0} max={9999} step={1} className={inputClass} value={draft.sortOrder} onChange={event => { const value = event.currentTarget.valueAsNumber; setDraft(current => ({ ...current, sortOrder: Number.isNaN(value) ? 0 : value })); }} />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-800">Description
              <textarea required rows={3} maxLength={600} className={inputClass} value={draft.description} onChange={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, description: value })); }} />
            </label>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-medium text-slate-800">Category photograph</h3>
              {preview && <Image src={preview} alt={draft.imageAlt || "Category photograph preview"} width={320} height={320} className="mt-3 aspect-square w-full max-w-xs rounded-lg object-cover" />}
              <label className="mt-4 block text-sm font-medium text-slate-800">{preview ? "Replace photograph" : "Upload photograph"}
                <input type="file" accept={BANNER_ACCEPT} onChange={upload} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-medium" />
              </label>
              <p className="mt-2 text-xs text-slate-600">Maximum 2 MiB. JPG, PNG, WebP, AVIF or SVG. Upload first, then save. Text-only edits keep the saved photograph.</p>
              {image && <p className="mt-2 text-sm font-medium text-blue-700">Uploaded photograph pending category save.</p>}
            </div>
            <label className="block text-sm font-medium text-slate-800">Image alt text
              <input required maxLength={200} className={inputClass} value={draft.imageAlt} onChange={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, imageAlt: value })); }} />
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
              <input type="checkbox" checked={draft.isPublished} onChange={event => { const checked = event.currentTarget.checked; setDraft(current => ({ ...current, isPublished: checked })); }} className="size-4 accent-blue-600" />
              Published — show this card on the homepage
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={primaryClass} disabled={busy || (!categoryDirty && mode !== "create")}>{phase === "save" ? "Saving…" : mode === "create" ? "Create category" : "Save category"}</button>
              <button type="button" className={buttonClass} onClick={closeEditor}>Cancel</button>
            </div>
          </fieldset>
        </form>
      )}

      <form onSubmit={saveSettings} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Section settings</h2>
        <p className="mt-1 text-sm text-slate-600">The heading, introduction and catalog button are saved separately from the cards.</p>
        <fieldset disabled={busy} className="mt-5 space-y-5 disabled:opacity-70">
          <div className="grid gap-5 sm:grid-cols-2">
            {([{ key: "eyebrow", label: "Eyebrow", max: 60 }, { key: "heading", label: "Heading", max: 160 }, { key: "ctaText", label: "Catalog button label", max: 60 }] as const).map(field => (
              <label key={field.key} className="block text-sm font-medium text-slate-800">{field.label}
                <input required maxLength={field.max} className={inputClass} value={settings[field.key]} onChange={event => { const value = event.currentTarget.value; setSettings(current => ({ ...current, [field.key]: value })); }} />
              </label>
            ))}
            <label className="block text-sm font-medium text-slate-800">Catalog destination
              <input readOnly value="/buying-house" className={inputClass + " bg-slate-50"} />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-800">Section description
            <textarea required rows={3} maxLength={600} className={inputClass} value={settings.description} onChange={event => { const value = event.currentTarget.value; setSettings(current => ({ ...current, description: value })); }} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryClass} disabled={busy || !settingsDirty}>{phase === "settings" ? "Saving…" : "Save section settings"}</button>
            <button type="button" className={buttonClass} disabled={busy || !settingsDirty} onClick={() => { if (!lock.current && window.confirm("Discard unsaved section settings?")) setSettings(savedSettings); }}>Discard settings changes</button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

