"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Languages, X } from "lucide-react";

export default function LanguageNotice() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Languages size={14} className="text-white/80" aria-hidden="true" />
          <span lang="ja">日本語 (JP)</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />

        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-100 -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-6 text-slate-900 shadow-2xl">
          <Dialog.Title className="text-center text-2xl font-bold text-blue-950">
            Notice / <span lang="ja">お知らせ</span>
          </Dialog.Title>

          <div className="flex flex-col items-center py-10 text-center">
            <div
              className="mb-6 flex size-20 items-center justify-center rounded-full bg-amber-50 text-4xl motion-safe:animate-pulse"
              aria-hidden="true"
            >
              🚧
            </div>

            <h3 className="mb-2 text-xl font-bold text-slate-800">
              Under Development
            </h3>

            <Dialog.Description className="px-4 leading-relaxed text-slate-500">
              We are currently working on our Japanese website to serve you
              better.
            </Dialog.Description>

            <div
              lang="ja"
              className="mt-6 w-full border-t border-slate-100 pt-6"
            >
              <p className="font-medium text-blue-600 italic">
                日本語版サイトは現在制作中です。
              </p>

              <p className="mt-1 text-sm text-slate-400">
                公開までしばらくお待ちください。
              </p>
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close notice"
              className="absolute top-3 right-3 rounded-sm p-1 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
