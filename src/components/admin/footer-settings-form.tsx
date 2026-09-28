"use client";

import { useId, useState, type ReactNode, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  FOOTER_SOCIAL_PLATFORMS,
  type FooterLink,
  type FooterSocial,
  type FooterSocialPlatform,
  type SiteContact,
  type SiteFooter,
} from "@/types/site-settings";

const inputClassName =
  "w-full min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const labelClassName = "block text-sm font-medium text-slate-800";
const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const ghostButtonClassName =
  "inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const platformLabels: Record<FooterSocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X (Twitter)",
};

type FooterSettingsFormProps = {
  initialFooter: SiteFooter;
  contact: SiteContact;
};

let sequence = 0;
/** Client-only, collision-free link id that matches the server pattern. */
function nextLinkId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function FooterSettingsForm({
  initialFooter,
  contact,
}: FooterSettingsFormProps) {
  const router = useRouter();
  const id = useId();

  const [brandDescription, setBrandDescription] = useState(
    initialFooter.brandDescription,
  );
  const [address, setAddress] = useState(initialFooter.address);
  const [emails, setEmails] = useState<string[]>(
    initialFooter.emails.length > 0 ? initialFooter.emails : [""],
  );
  const [quickLinks, setQuickLinks] = useState<FooterLink[]>(
    initialFooter.quickLinks,
  );
  const [socials, setSocials] = useState<FooterSocial[]>(initialFooter.socials);
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialFooter.whatsappNumber,
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialFooter.whatsappMessage,
  );
  const [copyrightOwner, setCopyrightOwner] = useState(
    initialFooter.copyrightOwner,
  );
  const [legalLinks, setLegalLinks] = useState<FooterLink[]>(
    initialFooter.legalLinks,
  );
  const [attribution, setAttribution] = useState<FooterLink | null>(
    initialFooter.attribution,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const usedPlatforms = new Set(socials.map((social) => social.platform));
  const availablePlatforms = FOOTER_SOCIAL_PLATFORMS.filter(
    (platform) => !usedPlatforms.has(platform),
  );

  function move(
    setter: React.Dispatch<React.SetStateAction<FooterLink[]>>,
    links: FooterLink[],
    index: number,
    direction: -1 | 1,
  ) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    setter(next);
  }

  function updateLink(
    setter: React.Dispatch<React.SetStateAction<FooterLink[]>>,
    index: number,
    patch: Partial<FooterLink>,
  ) {
    setter((current) =>
      current.map((link, position) =>
        position === index ? { ...link, ...patch } : link,
      ),
    );
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const payload = {
      brandDescription,
      address,
      emails: emails.map((email) => email.trim()).filter(Boolean),
      quickLinks: quickLinks
        .map((link) => ({
          ...link,
          label: link.label.trim(),
          href: link.href.trim(),
        }))
        .filter((link) => link.label && link.href),
      socials: socials
        .map((social) => ({ ...social, href: social.href.trim() }))
        .filter((social) => social.href),
      whatsappNumber: whatsappNumber.trim(),
      whatsappMessage: whatsappMessage.trim(),
      copyrightOwner: copyrightOwner.trim(),
      legalLinks: legalLinks
        .map((link) => ({
          ...link,
          label: link.label.trim(),
          href: link.href.trim(),
        }))
        .filter((link) => link.label && link.href),
      attribution: attribution
        ? {
            ...attribution,
            label: attribution.label.trim(),
            href: attribution.href.trim(),
          }
        : null,
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/site-settings/footer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Unable to save the footer.");
        return;
      }

      setMessage("Footer saved.");
      router.refresh();
    } catch {
      setError("Unable to connect. Your changes are still here.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 w-full max-w-5xl space-y-6">
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        <Group
          title="Brand"
          description="Shown under the logos in the footer. The logos themselves are managed on the Logos page."
        >
          <Field
            label="Brand description"
            htmlFor={`${id}-brand`}
            hint={`${brandDescription.length}/400 characters`}
          >
            <textarea
              id={`${id}-brand`}
              rows={3}
              maxLength={400}
              value={brandDescription}
              onChange={(event) =>
                setBrandDescription(event.currentTarget.value)
              }
              className={`${inputClassName} resize-y`}
            />
          </Field>

          <Field
            label="Address"
            htmlFor={`${id}-address`}
            hint="Leave empty to hide the address line."
          >
            <textarea
              id={`${id}-address`}
              rows={3}
              maxLength={300}
              value={address}
              onChange={(event) => setAddress(event.currentTarget.value)}
              className={`${inputClassName} resize-y`}
            />
          </Field>

          <Field
            label="Copyright owner"
            htmlFor={`${id}-owner`}
            hint="Appears in the bottom line next to the current year."
          >
            <input
              id={`${id}-owner`}
              type="text"
              maxLength={120}
              value={copyrightOwner}
              onChange={(event) => setCopyrightOwner(event.currentTarget.value)}
              className={inputClassName}
            />
          </Field>
        </Group>

        <Group
          title="Contact"
          description="Phone numbers and the first two emails are managed on the Contact details page and are reused here. Add any extra addresses below — duplicates are removed automatically."
        >
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">
              Reused from Contact details
            </p>

            <ul className="mt-2 space-y-1">
              {contact.phones.map((phone) => (
                <li key={`phone-${phone.href}`}>{phone.label}</li>
              ))}
              {contact.topBarEmails.map((email) => (
                <li key={`email-${email}`}>{email}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className={labelClassName}>Additional footer emails</p>

            {emails.map((email, index) => (
              <div key={`extra-email-${index}`} className="flex gap-2">
                <input
                  type="email"
                  aria-label={`Additional email ${index + 1}`}
                  maxLength={254}
                  value={email}
                  onChange={(event) => {
                    const newEmail = event.currentTarget.value;

                    setEmails((current) =>
                      current.map((value, position) =>
                        position === index ? newEmail : value,
                      ),
                    );
                  }}
                  className={inputClassName}
                  placeholder="sales@alliancebd.com"
                />

                <button
                  type="button"
                  aria-label={`Remove additional email ${index + 1}`}
                  disabled={emails.length === 1}
                  onClick={() =>
                    setEmails((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  className={ghostButtonClassName}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            {emails.length < 10 && (
              <button
                type="button"
                className={ghostButtonClassName}
                onClick={() => setEmails((current) => [...current, ""])}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add email
              </button>
            )}
          </div>
        </Group>

        <Group
          title="Quick links"
          description="The order here is the order in the footer. A platform is only linked once, and only when a URL is entered."
        >
          <div className="space-y-3">
            {quickLinks.map((link, index) => (
              <div
                key={link.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    aria-label={`Quick link ${index + 1} label`}
                    maxLength={60}
                    value={link.label}
                    onChange={(event) =>
                      updateLink(setQuickLinks, index, {
                        label: event.currentTarget.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="Label"
                  />

                  <input
                    aria-label={`Quick link ${index + 1} destination`}
                    maxLength={2048}
                    value={link.href}
                    onChange={(event) =>
                      updateLink(setQuickLinks, index, {
                        href: event.currentTarget.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="/about or https://example.com"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">#{index + 1}</span>

                  <button
                    type="button"
                    aria-label={`Move “${link.label || "this link"}” up`}
                    disabled={index === 0}
                    onClick={() => move(setQuickLinks, quickLinks, index, -1)}
                    className={ghostButtonClassName}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Move “${link.label || "this link"}” down`}
                    disabled={index === quickLinks.length - 1}
                    onClick={() => move(setQuickLinks, quickLinks, index, 1)}
                    className={ghostButtonClassName}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuickLinks((current) =>
                        current.filter((_, position) => position !== index),
                      )
                    }
                    className={`${ghostButtonClassName} ml-auto text-red-700 hover:bg-red-50`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {quickLinks.length < 20 && (
              <button
                type="button"
                className={ghostButtonClassName}
                onClick={() =>
                  setQuickLinks((current) => [
                    ...current,
                    { id: nextLinkId("link"), label: "", href: "/" },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add quick link
              </button>
            )}
          </div>
        </Group>

        <Group
          title="Social and WhatsApp"
          description="Only the platforms with a URL are rendered. Leave a number empty to hide the WhatsApp button."
        >
          <div className="space-y-3">
            {socials.map((social, index) => (
              <div key={social.platform} className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                  {platformLabels[social.platform]}
                </span>

                <input
                  type="url"
                  aria-label={`${platformLabels[social.platform]} profile URL`}
                  maxLength={2048}
                  value={social.href}
                  onChange={(event) => {
                    const href = event.currentTarget.value;

                    setSocials((current) =>
                      current.map((value, position) =>
                        position === index ? { ...value, href } : value,
                      ),
                    );
                  }}
                  className={`${inputClassName} flex-1`}
                  placeholder="https://facebook.com/yourpage"
                />

                <button
                  type="button"
                  aria-label={`Remove ${platformLabels[social.platform]}`}
                  onClick={() =>
                    setSocials((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  className={ghostButtonClassName}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}

            {availablePlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    className={ghostButtonClassName}
                    onClick={() =>
                      setSocials((current) => [
                        ...current,
                        { platform, href: "" },
                      ])
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {platformLabels[platform]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="WhatsApp number"
              htmlFor={`${id}-wa`}
              hint="One international number, digits only, e.g. +8801712345678."
            >
              <input
                id={`${id}-wa`}
                type="tel"
                maxLength={24}
                value={whatsappNumber}
                onChange={(event) =>
                  setWhatsappNumber(event.currentTarget.value)
                }
                className={inputClassName}
                placeholder="+8801712345678"
              />
            </Field>

            <Field
              label="WhatsApp message"
              htmlFor={`${id}-wa-message`}
              hint="Optional pre-filled message."
            >
              <input
                id={`${id}-wa-message`}
                type="text"
                maxLength={300}
                value={whatsappMessage}
                onChange={(event) =>
                  setWhatsappMessage(event.currentTarget.value)
                }
                className={inputClassName}
              />
            </Field>
          </div>
        </Group>

        <Group
          title="Legal links and attribution"
          description="Every link here is optional. Empty rows and an empty attribution are hidden on the website, so no placeholder or dead link is ever published."
        >
          <div className="space-y-3">
            {legalLinks.map((link, index) => (
              <div
                key={link.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    aria-label={`Legal link ${index + 1} label`}
                    maxLength={60}
                    value={link.label}
                    onChange={(event) =>
                      updateLink(setLegalLinks, index, {
                        label: event.currentTarget.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="Privacy policy"
                  />

                  <input
                    aria-label={`Legal link ${index + 1} destination`}
                    maxLength={2048}
                    value={link.href}
                    onChange={(event) =>
                      updateLink(setLegalLinks, index, {
                        href: event.currentTarget.value,
                      })
                    }
                    className={inputClassName}
                    placeholder="/privacy-policy"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">#{index + 1}</span>

                  <button
                    type="button"
                    aria-label={`Move “${link.label || "this link"}” up`}
                    disabled={index === 0}
                    onClick={() => move(setLegalLinks, legalLinks, index, -1)}
                    className={ghostButtonClassName}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Move “${link.label || "this link"}” down`}
                    disabled={index === legalLinks.length - 1}
                    onClick={() => move(setLegalLinks, legalLinks, index, 1)}
                    className={ghostButtonClassName}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLegalLinks((current) =>
                        current.filter((_, position) => position !== index),
                      )
                    }
                    className={`${ghostButtonClassName} ml-auto text-red-700 hover:bg-red-50`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {legalLinks.length < 20 && (
              <button
                type="button"
                className={ghostButtonClassName}
                onClick={() =>
                  setLegalLinks((current) => [
                    ...current,
                    { id: nextLinkId("legal"), label: "", href: "/" },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add legal link
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={attribution !== null}
              onChange={(event) =>
                setAttribution(
                  event.currentTarget.checked
                    ? { id: "credit-1", label: "", href: "https://" }
                    : null,
                )
              }
              className="size-4 rounded border-slate-300 text-blue-600"
            />
            Show an attribution link
          </label>

          {attribution && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Attribution label" htmlFor={`${id}-credit-label`}>
                <input
                  id={`${id}-credit-label`}
                  type="text"
                  maxLength={60}
                  value={attribution.label}
                  onChange={(event) =>
                    setAttribution({
                      ...attribution,
                      label: event.currentTarget.value,
                    })
                  }
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Attribution URL"
                htmlFor={`${id}-credit-href`}
                hint="A site path or a full https:// address."
              >
                <input
                  id={`${id}-credit-href`}
                  type="text"
                  maxLength={2048}
                  value={attribution.href}
                  onChange={(event) =>
                    setAttribution({
                      ...attribution,
                      href: event.currentTarget.value,
                    })
                  }
                  className={inputClassName}
                />
              </Field>
            </div>
          )}
        </Group>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <button type="submit" className={primaryButtonClassName}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {saving ? "Saving…" : "Save footer"}
          </button>

          <p className="text-xs text-slate-500 sm:ml-auto">
            Saving here never changes contact details, logos, banners or the
            call-to-action section.
          </p>
        </div>
      </fieldset>
    </form>
  );
}
