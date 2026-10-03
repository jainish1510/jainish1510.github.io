"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };
  const next = String(formData.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}
