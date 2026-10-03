"use client";

import { Check, Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = (await res.json()) as { error?: string; field?: string };
      if (!res.ok) throw Object.assign(new Error(data.error ?? "Couldn't send."), { field: data.field });
      setState("sent");
    } catch (err) {
      setError({ message: (err as Error).message, field: (err as { field?: string }).field });
      setState("idle");
    }
  }

  if (state === "sent")
    return (
      <div className="flex flex-col items-start justify-center rounded-2xl border border-line bg-surface p-10" role="status">
        <span className="grid size-10 place-items-center rounded-full bg-success/15 text-success">
          <Check className="size-5" />
        </span>
        <p className="mt-5 text-2xl tracking-tight text-fg">Message received.</p>
        <p className="mt-2 text-sm text-muted">Thanks for reaching out — I read everything and reply as soon as I can.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-surface p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-name" error={error?.field === "name" ? error.message : undefined}>
          <Input id="c-name" name="name" required maxLength={80} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="c-email" error={error?.field === "email" ? error.message : undefined}>
          <Input id="c-email" name="email" type="email" required maxLength={254} autoComplete="email" />
        </Field>
      </div>
      <Field label="Message" htmlFor="c-message" error={error?.field === "message" ? error.message : undefined}>
        <Textarea id="c-message" name="message" required minLength={10} maxLength={5000} className="min-h-44" />
      </Field>
      <div aria-hidden className="absolute left-[-10000px]">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && !error.field ? (
        <p role="alert" className="text-sm text-danger">
          {error.message}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" disabled={state === "sending"} className="w-full sm:w-auto">
        {state === "sending" ? <Loader2 className="animate-spin" /> : <Send />}
        Send message
      </Button>
    </form>
  );
}
