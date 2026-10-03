import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioMark } from "@/components/brand/icons";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  if (await getCurrentUser()) redirect(safeNext);
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-5">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-50" aria-hidden />
      <div className="relative w-full max-w-sm">
        <StudioMark className="size-7 text-fg" />
        <h1 className="mt-8 text-2xl font-medium tracking-tight text-fg">Studio admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in to write, publish and moderate.</p>
        <LoginForm next={safeNext} />
        <p className="mt-8 text-xs text-subtle">
          Credentials are set via <code className="font-mono">ADMIN_EMAIL</code> / <code className="font-mono">ADMIN_PASSWORD</code> when seeding. See the README.
        </p>
      </div>
    </main>
  );
}
