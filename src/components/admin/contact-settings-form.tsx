"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SiteContact } from "@/types/site-settings";

type ContactSettingsFormProps = {
  initialContact: SiteContact;
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export default function ContactSettingsForm({
  initialContact,
}: ContactSettingsFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const values = {
      phones: [
        { label: String(formData.get("phone1") ?? "") },
        { label: String(formData.get("phone2") ?? "") },
      ],
      topBarEmails: [
        String(formData.get("email1") ?? ""),
        String(formData.get("email2") ?? ""),
      ],
    };

    setPending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Unable to save settings.");
        return;
      }

      setMessage("Contact details saved successfully.");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-6"
    >
      <fieldset disabled={pending} className="space-y-6">
        <legend className="mb-5 text-lg font-semibold">
          Header contact details
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index}>
              <label
                htmlFor={`phone${index + 1}`}
                className="text-sm font-medium"
              >
                Phone {index + 1}
              </label>

              <input
                id={`phone${index + 1}`}
                name={`phone${index + 1}`}
                type="tel"
                required
                maxLength={30}
                defaultValue={initialContact.phones[index]?.label ?? ""}
                className={inputClassName}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index}>
              <label
                htmlFor={`email${index + 1}`}
                className="text-sm font-medium"
              >
                Email {index + 1}
              </label>

              <input
                id={`email${index + 1}`}
                name={`email${index + 1}`}
                type="email"
                required
                maxLength={254}
                defaultValue={initialContact.topBarEmails[index] ?? ""}
                className={inputClassName}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {message}
        </p>
      )}
    </form>
  );
}
