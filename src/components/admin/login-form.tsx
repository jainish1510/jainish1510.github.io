"use client";

import { Loader2 } from "lucide-react";
import { startTransition, useActionState, type FormEvent } from "react";
import { loginAction } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);

  // Submitting through onSubmit (not the `action` prop) skips React's automatic
  // form reset, so a failed attempt keeps the email the user typed.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
