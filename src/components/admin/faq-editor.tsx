"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { AdminFaq, FaqInput } from "@/types/faq";
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
  useActionRunner,
  useEditorHeading,
  useUnsavedChanges,
} from "@/components/admin/editor-ui";

const PAGE_SIZE = 10;

type Draft = FaqInput & { id: string | null };
type Reply = {
  message: string;
  faq?: AdminFaq;
  faqs?: AdminFaq[];
};

function blank(sortOrder: number): Draft {
  return { id: null, question: "", answer: "", sortOrder, isActive: true };
}

function draftOf(record: AdminFaq): Draft {
  return {
    id: record.id,
    question: record.question,
    answer: record.answer,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

function ordered(records: AdminFaq[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

/**
 * The FAQ editor on /admin/faqs.
 *
 * Follows the same shell as the other list editors in this admin: the list, the
 * create/edit form and the move buttons are one screen, the unsaved-changes guard
 * and the single in-flight action come from `editor-ui`, and a delete is confirmed
 * in a `ConfirmDialog` rather than a browser prompt.
 *
 * Searching and paging are done here rather than on the server. The whole list is
 * small — the page ships with eight questions — and filtering the rows already in
 * memory keeps typing in the search box instant and needs no round trip.
 *
 * Ordering is the one place the server is authoritative: reordering submits every
 * id at once, and the server refuses the write if the list changed underneath, so
 * a stale tab cannot quietly drop a question.
 */
export default function FaqEditor({ initialFaqs }: { initialFaqs: AdminFaq[] }) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(() => blank(0));
  const [baseline, setBaseline] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminFaq | null>(null);
  const editorHeading = useEditorHeading();
  const { phase, error, message, busy, perform, setError, setMessage, locked } =
    useActionRunner();

  const dirty = mode !== "list" && JSON.stringify(draft) !== baseline;
  useUnsavedChanges(dirty, busy);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = ordered(faqs);
    if (!needle) return list;
    return list.filter(
      (record) =>
        record.question.toLowerCase().includes(needle) ||
        record.answer.toLowerCase().includes(needle),
    );
  }, [faqs, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function canAbandon() {
    return !locked && (!dirty || window.confirm("Discard unsaved changes?"));
  }

  function openEditor(record?: AdminFaq) {
    if (!canAbandon()) return;
    // A new question goes to the end of the published order.
    const next = record
      ? draftOf(record)
      : blank(Math.min(9999, Math.max(-1, ...faqs.map((item) => item.sortOrder)) + 1));
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
    if (locked || !event.currentTarget.reportValidity()) return;
    const { id, ...fields } = draft;

    await perform("save", async () => {
      const result = await adminRequest<Reply>(
        id ? `/api/faq/${id}` : "/api/faq",
        id ? "PATCH" : "POST",
        fields,
      );
      if (!result.faq) {
        throw new Error("Save returned no question. Reload to check its status.");
      }
      setFaqs((current) =>
        ordered([...current.filter((item) => item.id !== result.faq!.id), result.faq!]),
      );
      const next = draftOf(result.faq);
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setMode("edit");
      setMessage(result.message);
    });
  }

  async function remove() {
    if (!pendingDelete || locked) return;
    const record = pendingDelete;

    await perform("delete", async () => {
      const result = await adminRequest<Reply>(`/api/faq/${record.id}`, "DELETE");
      setFaqs((current) => current.filter((item) => item.id !== record.id));
      setPendingDelete(null);
      setMessage(result.message);
    });
  }

  async function move(record: AdminFaq, direction: number) {
    if (locked) return;
    const list = ordered(faqs);
    const position = list.findIndex((item) => item.id === record.id);
    const target = position + direction;
    if (target < 0 || target >= list.length) return;

    const next = [...list];
    [next[position], next[target]] = [next[target], next[position]];

    await perform("order", async () => {
      const result = await adminRequest<Reply>("/api/faq/order", "PUT", {
        ids: next.map((item) => item.id),
      });
      if (!result.faqs) {
        throw new Error("Reload to check the new order.");
      }
      setFaqs(result.faqs);
      setMessage(result.message);
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Frequently asked questions
          </h1>
          <p className="mt-2 text-slate-600">
            The questions and answers published in the FAQ band on the Global
            Partners page, in the order they appear there.
          </p>
        </div>
        {mode === "list" ? (
          <button
            type="button"
            onClick={() => openEditor()}
            disabled={busy}
            className={primaryClass}
          >
            <Plus className="size-4" aria-hidden="true" />
            New question
          </button>
        ) : (
          <button
            type="button"
            onClick={closeEditor}
            disabled={busy}
            className={buttonClass}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to questions
          </button>
        )}
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

      {mode === "list" ? (
        <>
          <div className="min-w-56 flex-1">
            <label htmlFor="faq-search" className="text-sm font-semibold text-slate-800">
              Search
            </label>
            <input
              id="faq-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Question or answer text"
              className={inputClass}
            />
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              {faqs.length === 0
                ? "No questions yet. Add one, or run the FAQ initialization command to publish the eight the Global Partners page ships with."
                : "No questions match this search."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  {filtered.length} of {faqs.length} questions shown, in published order
                </caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">No.</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Question</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((record) => {
                    const position = ordered(faqs).findIndex(
                      (item) => item.id === record.id,
                    );
                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-3 tabular-nums text-slate-500">
                          {position + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {record.question}
                          <span className="mt-1 block max-w-prose text-sm font-normal text-slate-600">
                            {record.answer}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {record.isActive ? "Published" : "Hidden"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => move(record, -1)}
                              disabled={busy || position === 0}
                              aria-label={`Move ${record.question} up`}
                              className={buttonClass}
                            >
                              <ArrowUp className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(record, 1)}
                              disabled={busy || position === faqs.length - 1}
                              aria-label={`Move ${record.question} down`}
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
                              onClick={() => setPendingDelete(record)}
                              disabled={busy}
                              aria-label={`Delete ${record.question}`}
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
              aria-label="FAQ pages"
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
        </>
      ) : (
        <form
          onSubmit={save}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          aria-busy={busy}
        >
          <h2
            ref={editorHeading}
            tabIndex={-1}
            className="mb-5 scroll-mt-24 text-xl font-semibold text-slate-900"
          >
            {mode === "create" ? "New question" : "Edit question"}
          </h2>

          <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
            <label className="block text-sm font-medium text-slate-800">
              Question
              <input
                required
                maxLength={300}
                className={inputClass}
                value={draft.question}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setDraft((current) => ({ ...current, question: value }));
                }}
              />
            </label>

            <label className="block text-sm font-medium text-slate-800">
              Answer
              <textarea
                required
                rows={5}
                maxLength={2000}
                className={inputClass}
                value={draft.answer}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setDraft((current) => ({ ...current, answer: value }));
                }}
              />
            </label>

            <label className="block max-w-xs text-sm font-medium text-slate-800">
              Display order
              <input
                type="number"
                required
                min={0}
                max={9999}
                step={1}
                className={inputClass}
                value={draft.sortOrder}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  setDraft((current) => ({
                    ...current,
                    sortOrder: Number.isNaN(value) ? 0 : value,
                  }));
                }}
              />
            </label>

            <div>
              <span className="text-sm font-medium text-slate-800">Visibility</span>
              <div className="mt-2">
                <ActiveToggle
                  id="faq-is-active"
                  checked={draft.isActive}
                  onChange={(next) =>
                    setDraft((current) => ({ ...current, isActive: next }))
                  }
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                A hidden question stays in this list and keeps its place, but is not
                published on the page.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className={primaryClass}
                disabled={busy || (!dirty && mode !== "create")}
              >
                {phase === "save"
                  ? "Saving…"
                  : mode === "create"
                    ? "Create question"
                    : "Save question"}
              </button>
              <button type="button" className={buttonClass} onClick={closeEditor}>
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this question?"
        description={
          pendingDelete && (
            <>
              <p>
                &ldquo;{pendingDelete.question}&rdquo; and its answer will be removed
                from the Global Partners page. This cannot be undone.
              </p>
              {pendingDelete.isActive ? (
                <p className="mt-3">
                  This question is currently published, so it will disappear from the
                  page immediately.
                </p>
              ) : null}
            </>
          )
        }
        confirmLabel="Delete question"
        busy={phase === "delete"}
        onConfirm={remove}
        onCancel={() => {
          if (!locked) setPendingDelete(null);
        }}
      />
    </section>
  );
}
