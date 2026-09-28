"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import LogoutButton from "@/components/admin/logout-button";
import {
  adminNavigation,
  getAdminSection,
  isAdminLinkActive,
  type AdminNavGroup,
} from "@/lib/admin-navigation";

type NavProps = {
  pathname: string | null;
  /** Called after a navigation so the mobile drawer can close itself. */
  onNavigate?: () => void;
};

function LinkRow({
  label,
  href,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const active = isAdminLinkActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={pathname === href ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-blue-50 font-semibold text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

function GroupRow({
  group,
  pathname,
  onNavigate,
}: {
  group: AdminNavGroup;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const hasActiveChild = (group.children ?? []).some((link) =>
    isAdminLinkActive(pathname, link.href),
  );

  // A direct entry or an in-group navigation keeps the group open: the key
  // below remounts this row when the group gains its active child, so the
  // manual collapse still survives navigation within the same group.
  const [expanded, setExpanded] = useState(hasActiveChild);
  const panelId = `admin-group-${group.label.toLowerCase().replace(/\s+/g, "-")}`;

  if (!group.children) {
    return (
      <Link
        href={group.href ?? "/admin"}
        onClick={onNavigate}
        aria-current={pathname === group.href ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
          isAdminLinkActive(pathname, group.href ?? "/admin")
            ? "bg-blue-50 text-blue-700"
            : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        <group.icon className="size-5 shrink-0" aria-hidden="true" />
        {group.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
          hasActiveChild
            ? "text-blue-700"
            : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        <group.icon className="size-5 shrink-0" aria-hidden="true" />
        <span className="flex-1">{group.label}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        hidden={!expanded}
        className="mt-1 space-y-1 border-l-2 border-slate-200 pl-3 ml-4"
      >
        {group.children.map(({ label, href, icon }) => (
          <LinkRow
            key={href}
            label={label}
            href={href}
            icon={icon}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The key flips when a group gains or loses its active child, remounting the
 * row so a direct entry or navigation into the group always shows it expanded,
 * while a manual collapse still survives navigation within the same group.
 */
export function SidebarNav({ pathname, onNavigate }: NavProps) {
  return (
    <nav
      aria-label="Admin sections"
      className="flex-1 space-y-1 overflow-y-auto px-4 py-5"
    >
      {adminNavigation.map((group) => (
        <GroupRow
          key={`${group.label}:${
            (group.children ?? []).some((link) =>
              isAdminLinkActive(pathname, link.href),
            )
          }`}
          group={group}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function Brand({
  bordered = true,
  onNavigate,
}: {
  bordered?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={`flex items-center gap-3 px-5 py-4 ${
        bordered ? "border-b border-slate-200" : ""
      }`}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
        AS
      </span>
      <span>
        <span className="block text-sm font-bold text-slate-900">
          Alliance CMS
        </span>
        <span className="block text-xs text-slate-500">Alliance Sourcing BD</span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-2 border-t border-slate-200 p-4">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        View website
      </Link>

      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700">
        <LogOut className="size-4" aria-hidden="true" />
        <LogoutButton />
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Remembers the route the drawer was opened on, so any navigation — link
  // click, browser back or forward — closes it without an effect.
  const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
  const drawerOpen = drawerOpenedAt !== null && drawerOpenedAt === pathname;
  const section = getAdminSection(pathname);

  const title = section?.link?.label ?? section?.group ?? "Admin";
  const groupLabel = section?.group;

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <Brand />
        <SidebarNav pathname={pathname} />
        <SidebarFooter />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Dialog.Root
              open={drawerOpen}
              onOpenChange={(open) => setDrawerOpenedAt(open ? pathname : null)}
            >
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open admin menu"
                  className="flex size-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
                >
                  <Menu className="size-6" aria-hidden="true" />
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl focus:outline-none lg:hidden">
                  <Dialog.Title className="sr-only">Admin sections</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Navigate between the content editors.
                  </Dialog.Description>

                  <div className="flex items-center justify-between border-b border-slate-200 pr-2">
                    <Brand
                      bordered={false}
                      onNavigate={() => setDrawerOpenedAt(null)}
                    />
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Close admin menu"
                        className="flex size-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        <X className="size-6" aria-hidden="true" />
                      </button>
                    </Dialog.Close>
                  </div>

                  <SidebarNav
                    pathname={pathname}
                    onNavigate={() => setDrawerOpenedAt(null)}
                  />
                  <SidebarFooter />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <div className="min-w-0 flex-1">
              {groupLabel && (
                <p className="truncate text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {groupLabel}
                </p>
              )}
              <p className="truncate text-lg font-bold text-slate-900">
                {title}
              </p>
            </div>

            <Link
              href="/"
              className="hidden text-sm font-medium text-blue-600 hover:text-blue-700 sm:inline"
            >
              View website
            </Link>

            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>

        <main
          id="admin-content"
          tabIndex={-1}
          className="px-4 py-8 outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
