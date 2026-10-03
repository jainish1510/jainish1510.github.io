"use client";

import { Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";

/**
 * A static site has no server to receive a form, so this composes the
 * message and hands it to the visitor's own email app (mailto:).
 */
export function ContactForm({ email }: { email: string }) {
  const [opened, setOpened] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const subject = `Hello from ${name || "your website"}`;
    const body = `${message}\n\n— ${name}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <Field label="Your name" htmlFor="c-name">
        <Input id="c-name" name="name" required maxLength={80} autoComplete="name" />
      </Field>
      <Field label="Message" htmlFor="c-message">
        <Textarea id="c-message" name="message" required minLength={10} maxLength={3000} className="min-h-44" />
      </Field>
      <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
        <Mail /> Write the email
      </Button>
      <p className="text-xs text-muted" role="status">
        {opened ? "Your email app should have opened with the message ready to send. Nothing is sent until you press Send there." : `This opens your email app addressed to ${email}. Nothing is stored on this site.`}
      </p>
    </form>
  );
}
