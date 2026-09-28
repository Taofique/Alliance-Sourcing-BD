import { redirect } from "next/navigation";

/** Legacy URL kept working; the contact editor now has its own page. */
export default function SettingsRedirectPage() {
  redirect("/admin/settings/contact");
}
