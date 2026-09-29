"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  /** The destructive detail: exactly what else this removes, counted. */
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

/**
 * The confirmation shown before a cascading delete.
 *
 * This exists because `window.confirm` is the wrong tool for it: the delete that
 * matters here is the one an admin is most likely to get wrong, since removing
 * a category silently removes every subcategory and product beneath it. A dialog
 * can name each level and its real count, and it can be styled to read as
 * dangerous rather than as a browser chrome interruption.
 *
 * Radix handles the focus trap, the escape key and the `aria-modal` wiring; the
 * initial focus goes to Cancel so a stray Enter cannot destroy anything.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px]" />

        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none"
        >
          <Dialog.Title className="font-heading text-xl font-bold text-slate-900">
            {title}
          </Dialog.Title>

          <div className="mt-3 text-sm leading-relaxed text-slate-600">
            {description}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
