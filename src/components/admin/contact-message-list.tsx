"use client";

import { useState } from "react";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import type { AdminContactMessage } from "@/types/contact-message";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import {
  adminRequest,
  buttonClass,
  dangerClass,
  errorClass,
  inputClass,
  noticeClass,
  useActionRunner,
} from "@/components/admin/editor-ui";

type Reply = {
  message: string;
  contactMessage?: AdminContactMessage;
};

function stamp(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * The inbox on /admin/contact-messages: what the /contact form has collected.
 *
 * Messages are read-only apart from two actions, marking read and deleting. A
 * visitor's message is not something an editor should be able to rewrite, so there
 * is no edit form and the API accepts no field but `isRead`.
 *
 * The list is filtered here rather than on the server, the same reasoning as the
 * other editors: an inbox is small enough to hold, and searching it should be
 * instant.
 */
export default function ContactMessageList({
  initialMessages,
}: {
  initialMessages: AdminContactMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [search, setSearch] = useState("");
  const [hideRead, setHideRead] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminContactMessage | null>(null);
  const { phase, error, message, busy, perform, setMessage, locked } =
    useActionRunner();

  const needle = search.trim().toLowerCase();
  const visible = messages.filter((record) => {
    if (hideRead && record.isRead) return false;
    if (!needle) return true;
    return (
      record.name.toLowerCase().includes(needle) ||
      record.email.toLowerCase().includes(needle) ||
      record.subject.toLowerCase().includes(needle) ||
      record.message.toLowerCase().includes(needle)
    );
  });

  const unread = messages.filter((record) => !record.isRead).length;

  async function markRead(record: AdminContactMessage, isRead: boolean) {
    await perform(`read-${record.id}`, async () => {
      const result = await adminRequest<Reply>(
        `/api/contact-messages/${record.id}`,
        "PATCH",
        { isRead },
      );
      if (!result.contactMessage) {
        throw new Error("Reload to check the message.");
      }
      setMessages((current) =>
        current.map((item) =>
          item.id === record.id ? result.contactMessage! : item,
        ),
      );
      setMessage(result.message);
    });
  }

  async function remove() {
    if (!pendingDelete || locked) return;
    const record = pendingDelete;

    await perform("delete", async () => {
      const result = await adminRequest<Reply>(
        `/api/contact-messages/${record.id}`,
        "DELETE",
      );
      setMessages((current) => current.filter((item) => item.id !== record.id));
      setPendingDelete(null);
      setMessage(result.message);
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
          Contact messages
        </h1>
        <p className="mt-2 text-slate-600">
          {messages.length === 0
            ? "Nothing has been sent from the Contact page yet."
            : `${messages.length} message${messages.length === 1 ? "" : "s"}, ${unread} unread.`}
        </p>
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

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-56 flex-1">
          <label
            htmlFor="contact-message-search"
            className="text-sm font-semibold text-slate-800"
          >
            Search
          </label>
          <input
            id="contact-message-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, subject or message"
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 pb-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hideRead}
            onChange={(event) => setHideRead(event.currentTarget.checked)}
            className="size-4"
          />
          Hide read messages
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          {messages.length === 0
            ? "No messages yet."
            : "No messages match this search."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((record) => (
            <li
              key={record.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                record.isRead ? "border-slate-200" : "border-blue-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900">
                    {record.subject}
                    {!record.isRead && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        Unread
                      </span>
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{record.name}</span>
                    {" · "}
                    <a
                      href={`mailto:${record.email}`}
                      className="text-blue-700 underline hover:text-blue-900"
                    >
                      {record.email}
                    </a>
                    {" · "}
                    <time dateTime={record.createdAt} className="text-slate-500">
                      {stamp(record.createdAt)}
                    </time>
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => markRead(record, !record.isRead)}
                    disabled={busy}
                    className={buttonClass}
                  >
                    {record.isRead ? (
                      <Mail className="size-4" aria-hidden="true" />
                    ) : (
                      <MailOpen className="size-4" aria-hidden="true" />
                    )}
                    {record.isRead ? "Mark unread" : "Mark read"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(record)}
                    disabled={busy}
                    aria-label={`Delete the message from ${record.name}`}
                    className={dangerClass}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Whitespace preserved, so an address or a list survives the round trip. */}
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                {record.message}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this message?"
        description={
          pendingDelete && (
            <p>
              The message from {pendingDelete.name} will be removed permanently. This
              cannot be undone, and you will not be able to reply to it afterwards.
            </p>
          )
        }
        confirmLabel="Delete message"
        busy={phase === "delete"}
        onConfirm={remove}
        onCancel={() => {
          if (!locked) setPendingDelete(null);
        }}
      />
    </section>
  );
}
