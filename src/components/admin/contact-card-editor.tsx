"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  CONTACT_CARD_ICON_KEYS,
  CONTACT_CARD_TYPES,
  type AdminContactCard,
  type ContactCardInput,
  type ContactCardValue,
} from "@/types/contact-card";
import { CONTACT_TYPE_LABELS } from "@/lib/contact-sections";
import { ContactCardGlyph } from "@/lib/contact-card-icons";
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
  selectClass,
  useActionRunner,
  useEditorHeading,
  useUnsavedChanges,
} from "@/components/admin/editor-ui";

const PAGE_SIZE = 10;

type Draft = ContactCardInput & { id: string | null };
type Reply = {
  message: string;
  card?: AdminContactCard;
  cards?: AdminContactCard[];
};

const ICON_LABELS: Record<(typeof CONTACT_CARD_ICON_KEYS)[number], string> = {
  mail: "Envelope",
  phone: "Telephone",
  mapPin: "Map pin",
  clock: "Clock",
};

function blank(sortOrder: number): Draft {
  return {
    id: null,
    type: "email",
    label: "",
    description: "",
    values: [],
    action: null,
    iconKey: "mail",
    mapEmbedUrl: "",
    sortOrder,
    isActive: true,
  };
}

function draftOf(record: AdminContactCard): Draft {
  return {
    id: record.id,
    type: record.type,
    label: record.label,
    description: record.description,
    values: record.values.map((value) => ({ ...value })),
    action: record.action ? { ...record.action } : null,
    iconKey: record.iconKey,
    mapEmbedUrl: record.mapEmbedUrl,
    sortOrder: record.sortOrder,
    isActive: record.isActive,
  };
}

function ordered(records: AdminContactCard[]) {
  return [...records].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

/** Mirrors the server rule, so the Save button explains itself. */
function showsSomething(card: Draft) {
  return (
    card.description.trim().length > 0 ||
    card.values.some((value) => value.text.trim().length > 0) ||
    Boolean(card.action?.label.trim() || card.action?.href.trim())
  );
}

/**
 * The contact card editor on /admin/contact-cards.
 *
 * The list, the create/edit form and the move buttons are one screen, matching the
 * FAQ and Products editors: the unsaved-changes guard and the single in-flight
 * action come from `editor-ui`, and a delete is confirmed in a `ConfirmDialog`.
 *
 * A card is a nested shape rather than a row of scalars — a list of values and an
 * optional action — so the form edits the list in place instead of asking for JSON.
 *
 * Ordering is the one place the server stays authoritative: reordering submits
 * every id at once and the server refuses the write if the list changed
 * underneath, so a stale tab cannot quietly drop a card.
 */
export default function ContactCardEditor({
  initialCards,
}: {
  initialCards: AdminContactCard[];
}) {
  const [cards, setCards] = useState(initialCards);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [draft, setDraft] = useState<Draft>(() => blank(0));
  const [baseline, setBaseline] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminContactCard | null>(null);
  const editorHeading = useEditorHeading();
  const { phase, error, message, busy, perform, setError, setMessage, locked } =
    useActionRunner();

  const dirty = mode !== "list" && JSON.stringify(draft) !== baseline;
  useUnsavedChanges(dirty, busy);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = ordered(cards);
    if (!needle) return list;
    return list.filter(
      (record) =>
        record.label.toLowerCase().includes(needle) ||
        record.description.toLowerCase().includes(needle) ||
        record.values.some((value) => value.text.toLowerCase().includes(needle)),
    );
  }, [cards, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function canAbandon() {
    return !locked && (!dirty || window.confirm("Discard unsaved changes?"));
  }

  function openEditor(record?: AdminContactCard) {
    if (!canAbandon()) return;
    // A new card goes to the end of the published order.
    const next = record
      ? draftOf(record)
      : blank(
          Math.min(9999, Math.max(-1, ...cards.map((item) => item.sortOrder)) + 1),
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

  function patch(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function setValue(index: number, changes: Partial<ContactCardValue>) {
    setDraft((current) => ({
      ...current,
      values: current.values.map((value, at) =>
        at === index ? { ...value, ...changes } : value,
      ),
    }));
  }

  function addValue() {
    setDraft((current) => ({
      ...current,
      values: [...current.values, { text: "", href: "" }],
    }));
  }

  function removeValue(index: number) {
    setDraft((current) => ({
      ...current,
      values: current.values.filter((_, at) => at !== index),
    }));
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked || !event.currentTarget.reportValidity()) return;
    const { id, ...fields } = draft;

    // Blank rows are dropped rather than sent, so a value cleared but not removed
    // does not come back as an empty line on the page.
    const payload = {
      ...fields,
      description: fields.description.trim(),
      values: fields.values
        .filter((value) => value.text.trim().length > 0)
        .map((value) => ({
          text: value.text.trim(),
          href: value.href?.trim() ? value.href.trim() : null,
        })),
      action:
        fields.action && (fields.action.label.trim() || fields.action.href.trim())
          ? {
              label: fields.action.label.trim(),
              href: fields.action.href.trim(),
            }
          : null,
      mapEmbedUrl: fields.mapEmbedUrl.trim(),
    };

    await perform("save", async () => {
      const result = await adminRequest<Reply>(
        id ? `/api/contact-cards/${id}` : "/api/contact-cards",
        id ? "PATCH" : "POST",
        payload,
      );
      if (!result.card) {
        throw new Error("Save returned no card. Reload to check its status.");
      }
      setCards((current) =>
        ordered([
          ...current.filter((item) => item.id !== result.card!.id),
          result.card!,
        ]),
      );
      const next = draftOf(result.card);
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
      const result = await adminRequest<Reply>(
        `/api/contact-cards/${record.id}`,
        "DELETE",
      );
      setCards((current) => current.filter((item) => item.id !== record.id));
      setPendingDelete(null);
      setMessage(result.message);
    });
  }

  async function move(record: AdminContactCard, direction: number) {
    if (locked) return;
    const list = ordered(cards);
    const position = list.findIndex((item) => item.id === record.id);
    const target = position + direction;
    if (target < 0 || target >= list.length) return;

    const next = [...list];
    [next[position], next[target]] = [next[target], next[position]];

    await perform("order", async () => {
      const result = await adminRequest<Reply>(
        "/api/contact-cards/order",
        "PUT",
        { ids: next.map((item) => item.id) },
      );
      if (!result.cards) {
        throw new Error("Reload to check the new order.");
      }
      setCards(result.cards);
      setMessage(result.message);
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Contact cards
          </h1>
          <p className="mt-2 text-slate-600">
            The boxes at the top of the Contact page, in the order they appear there.
            Add as many as you need &mdash; the page renders whatever is published.
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
            New card
          </button>
        ) : (
          <button
            type="button"
            onClick={closeEditor}
            disabled={busy}
            className={buttonClass}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to cards
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
            <label
              htmlFor="contact-card-search"
              className="text-sm font-semibold text-slate-800"
            >
              Search
            </label>
            <input
              id="contact-card-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Label, description or a value"
              className={inputClass}
            />
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              {cards.length === 0
                ? "No cards yet. Add one, or run the contact card initialization command to publish the three the Contact page ships with."
                : "No cards match this search."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  {filtered.length} of {cards.length} cards shown, in published order
                </caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-600 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">No.</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Card</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Map</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((record) => {
                    const position = ordered(cards).findIndex(
                      (item) => item.id === record.id,
                    );
                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-3 tabular-nums text-slate-500">
                          {position + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 font-semibold text-slate-900">
                            <ContactCardGlyph
                              iconKey={record.iconKey}
                              className="size-4 shrink-0 text-cyan-600"
                            />
                            {record.label}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {CONTACT_TYPE_LABELS[record.type]}
                            </span>
                          </span>
                          <span className="mt-1 block max-w-prose text-sm text-slate-600">
                            {record.description ||
                              record.values.map((value) => value.text).join(", ") ||
                              "—"}
                          </span>
                          {record.action && (
                            <span className="mt-1 block text-sm text-slate-500">
                              {record.action.label} &rarr; {record.action.href}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {record.mapEmbedUrl ? "Yes" : "—"}
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
                              aria-label={`Move ${record.label} up`}
                              className={buttonClass}
                            >
                              <ArrowUp className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(record, 1)}
                              disabled={busy || position === cards.length - 1}
                              aria-label={`Move ${record.label} down`}
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
                              aria-label={`Delete ${record.label}`}
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
              aria-label="Contact card pages"
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
            {mode === "create" ? "New card" : "Edit card"}
          </h2>

          <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-800">
                Label
                <input
                  required
                  maxLength={60}
                  placeholder="Office"
                  className={inputClass}
                  value={draft.label}
                  onChange={(event) => patch({ label: event.currentTarget.value })}
                />
              </label>

              <label className="block text-sm font-medium text-slate-800">
                Type
                <select
                  className={selectClass}
                  value={draft.type}
                  onChange={(event) =>
                    patch({ type: event.currentTarget.value as Draft["type"] })
                  }
                >
                  {CONTACT_CARD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CONTACT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-800">
              Description
              <textarea
                rows={2}
                maxLength={300}
                placeholder="Mon-Fri from 9am to 6pm."
                className={inputClass}
                value={draft.description}
                onChange={(event) => patch({ description: event.currentTarget.value })}
              />
            </label>

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">
                Values
              </legend>
              <p className="mb-3 text-xs text-slate-600">
                The linked lines inside the card &mdash; each address, number or
                mailbox. A link is optional; leave it empty to show the text on its
                own.
              </p>

              {draft.values.length === 0 ? (
                <p className="mb-3 text-sm text-slate-500">No values yet.</p>
              ) : (
                <ul className="mb-3 space-y-2">
                  {draft.values.map((value, index) => (
                    <li key={index} className="flex flex-wrap items-end gap-2">
                      <label className="min-w-40 flex-1 text-sm font-medium text-slate-800">
                        Text
                        <input
                          maxLength={200}
                          placeholder="+880 1972-438732"
                          className={inputClass}
                          value={value.text}
                          onChange={(event) =>
                            setValue(index, { text: event.currentTarget.value })
                          }
                        />
                      </label>
                      <label className="min-w-40 flex-1 text-sm font-medium text-slate-800">
                        Link
                        <input
                          maxLength={2000}
                          placeholder="tel:+8801972438732"
                          className={inputClass}
                          value={value.href ?? ""}
                          onChange={(event) =>
                            setValue(index, { href: event.currentTarget.value })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeValue(index)}
                        aria-label={`Remove value ${value.text || index + 1}`}
                        className={dangerClass}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={addValue}
                className={buttonClass}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add value
              </button>
            </fieldset>

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">
                Action link
              </legend>
              <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.action !== null}
                  onChange={(event) =>
                    patch({
                      action: event.currentTarget.checked
                        ? { label: "", href: "" }
                        : null,
                    })
                  }
                  className="size-4"
                />
                Show a link at the bottom of the card
              </label>

              {draft.action && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Label
                    <input
                      maxLength={60}
                      placeholder="Get directions"
                      className={inputClass}
                      value={draft.action.label}
                      onChange={(event) =>
                        patch({
                          action: {
                            label: event.currentTarget.value,
                            href: draft.action?.href ?? "",
                          },
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Link
                    <input
                      maxLength={2000}
                      placeholder="https://maps.google.com/&hellip;"
                      className={inputClass}
                      value={draft.action.href}
                      onChange={(event) =>
                        patch({
                          action: {
                            label: draft.action?.label ?? "",
                            href: event.currentTarget.value,
                          },
                        })
                      }
                    />
                  </label>
                </div>
              )}
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-800">
                Icon
                <select
                  className={selectClass}
                  value={draft.iconKey}
                  onChange={(event) =>
                    patch({ iconKey: event.currentTarget.value as Draft["iconKey"] })
                  }
                >
                  {CONTACT_CARD_ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {ICON_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-800">
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
                    patch({ sortOrder: Number.isNaN(value) ? 0 : value });
                  }}
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-800">
              Map embed link
              <input
                maxLength={2000}
                placeholder="https://www.google.com/maps/embed?pb=&hellip;"
                className={inputClass}
                value={draft.mapEmbedUrl}
                onChange={(event) => patch({ mapEmbedUrl: event.currentTarget.value })}
              />
              <span className="mt-2 block text-xs text-slate-600">
                The first published card with one of these supplies the map beside the
                message form. Must be an <code>https://</code> link.
              </span>
            </label>

            <div>
              <span className="text-sm font-medium text-slate-800">Visibility</span>
              <div className="mt-2">
                <ActiveToggle
                  id="contact-card-is-active"
                  checked={draft.isActive}
                  onChange={(next) => patch({ isActive: next })}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                A hidden card stays in this list and keeps its place, but is not
                published on the page.
              </p>
            </div>

            {!showsSomething(draft) && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Add a description, a value or an action link &mdash; a card with
                nothing in it would show as an empty box.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className={primaryClass}
                disabled={busy || !showsSomething(draft) || (!dirty && mode !== "create")}
              >
                {phase === "save"
                  ? "Saving…"
                  : mode === "create"
                    ? "Create card"
                    : "Save card"}
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
        title="Delete this card?"
        description={
          pendingDelete && (
            <>
              <p>
                &ldquo;{pendingDelete.label}&rdquo; will be removed from the Contact
                page. This cannot be undone.
              </p>
              {pendingDelete.mapEmbedUrl ? (
                <p className="mt-3">
                  This card holds the map embed, so the map beside the message form
                  will disappear until another published card provides one.
                </p>
              ) : null}
              {pendingDelete.isActive ? (
                <p className="mt-3">
                  This card is currently published, so it will disappear from the page
                  immediately.
                </p>
              ) : null}
            </>
          )
        }
        confirmLabel="Delete card"
        busy={phase === "delete"}
        onConfirm={remove}
        onCancel={() => {
          if (!locked) setPendingDelete(null);
        }}
      />
    </section>
  );
}
