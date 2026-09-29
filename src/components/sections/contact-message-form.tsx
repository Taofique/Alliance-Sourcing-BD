"use client";

import { useState, type FormEvent } from "react";
import { contactMessage } from "@/lib/contact-sections";

type FieldName = "name" | "email" | "subject" | "message";

const EMPTY_FORM: Record<FieldName, string> = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const FIELDS: FieldName[] = ["name", "email", "subject", "message"];

/**
 * The same rules the server enforces, so a mistake is caught before a round trip.
 *
 * The wording is taken from `contactMessageCreateSchema` rather than invented
 * here: if the two ever disagreed, the visitor would see one message here and a
 * different one after submitting the same form.
 */
const RULES: Record<FieldName, (value: string) => string> = {
  name: (value) =>
    value.length < 2
      ? "Enter your name."
      : value.length > 80
        ? "Keep your name under 80 characters."
        : "",
  email: (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? "Enter a valid email."
      : value.length > 254
        ? "Keep the email under 254 characters."
        : "",
  subject: (value) =>
    value.length > 150 ? "Keep the subject under 150 characters." : "",
  message: (value) =>
    value.length < 10
      ? "Tell us a little more — 10 characters or more."
      : value.length > 4000
        ? "Keep the message under 4000 characters."
        : "",
};

function validate(values: Record<FieldName, string>) {
  const errors = {} as Partial<Record<FieldName, string>>;

  for (const field of FIELDS) {
    const message = RULES[field](values[field]);
    if (message) errors[field] = message;
  }

  return errors;
}

/**
 * The message form beside the map at the bottom of /contact.
 *
 * Posts to our own `/api/contact`, which stores the message and returns a plain
 * acknowledgement. The success text is shown only after that call resolves, so a
 * failed send never claims to have worked.
 */
export default function ContactMessageForm() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "bad"; text: string } | null>(
    null,
  );

  function change(field: FieldName, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Clear the complaint as soon as the visitor starts fixing it.
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: RULES[field](value) }));
    }
  }

  function blur(field: FieldName) {
    setTouched((previous) => ({ ...previous, [field]: true }));
    setErrors((previous) => ({ ...previous, [field]: RULES[field](values[field]) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const found = validate(values);
    setTouched({ name: true, email: true, subject: true, message: true });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setStatus({
          tone: "bad",
          text: data?.message ?? contactMessage.errorMessage,
        });
        return;
      }

      setValues(EMPTY_FORM);
      setErrors({});
      setTouched({});
      setHoneypot("");
      setStatus({ tone: "ok", text: contactMessage.successMessage });
    } catch {
      setStatus({ tone: "bad", text: contactMessage.errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          name="name"
          label="Name"
          value={values.name}
          placeholder={contactMessage.placeholders.name}
          error={touched.name ? errors.name : undefined}
          onChange={change}
          onBlur={blur}
          disabled={isSubmitting}
        />
        <Field
          name="email"
          type="email"
          label="Email"
          value={values.email}
          placeholder={contactMessage.placeholders.email}
          error={touched.email ? errors.email : undefined}
          onChange={change}
          onBlur={blur}
          disabled={isSubmitting}
        />
      </div>

      <Field
        name="subject"
        label="Subject"
        value={values.subject}
        placeholder={contactMessage.placeholders.subject}
        error={touched.subject ? errors.subject : undefined}
        onChange={change}
        onBlur={blur}
        disabled={isSubmitting}
      />

      <div>
        <Field
          name="message"
          label="Message"
          value={values.message}
          placeholder={contactMessage.placeholders.message}
          error={touched.message ? errors.message : undefined}
          onChange={change}
          onBlur={blur}
          disabled={isSubmitting}
          textarea
        />
      </div>

      {/*
        Bots fill in every input they find; people never see this one. The wrapper
        is `aria-hidden`, so it is out of the accessibility tree as well as out of
        sight, and it collapses to a single pixel rather than taking a line of its
        own in the form.
      */}
      <div aria-hidden="true" className="h-px w-px overflow-hidden">
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {status && (
        <p
          role={status.tone === "bad" ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            status.tone === "ok"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {status.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-3 rounded-xl px-[2em] py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Sending…" : contactMessage.submitLabel}
      </button>
    </form>
  );
}

type FieldProps = {
  name: FieldName;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  disabled: boolean;
  type?: string;
  textarea?: boolean;
  onChange: (field: FieldName, value: string) => void;
  onBlur: (field: FieldName) => void;
};

function Field({
  name,
  label,
  value,
  placeholder,
  error,
  disabled,
  type = "text",
  textarea = false,
  onChange,
  onBlur,
}: FieldProps) {
  const id = `contact-${name}`;
  const shared =
    "w-full rounded-xl border px-5 py-3 text-sm placeholder:text-slate-300 focus:ring-2 focus:outline-none disabled:opacity-60";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 ml-1 block text-xs font-bold tracking-wider text-slate-700 uppercase"
      >
        {label} <span className="text-red-500">*</span>
      </label>

      {textarea ? (
        <textarea
          id={id}
          name={name}
          rows={4}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          className={`${shared} resize-none ${
            error ? "border-red-400" : "border-slate-200 focus:border-cyan-500"
          }`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
          className={`${shared} ${
            error ? "border-red-400" : "border-slate-200 focus:border-cyan-500"
          }`}
        />
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 ml-1 text-[11px] font-bold tracking-tight text-red-500 uppercase"
        >
          {error}
        </p>
      )}
    </div>
  );
}
