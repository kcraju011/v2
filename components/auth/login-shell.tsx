"use client";

import Link from "next/link";
import { Fingerprint, KeyRound, Shield } from "lucide-react";
import type { TenantConfig } from "@/lib/tenant/config";

export function LoginShell({ tenant }: { tenant: TenantConfig }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid overflow-hidden rounded-frame border border-line bg-panel shadow-frame lg:grid-cols-[1.1fr_.9fr]">
        <section className="border-b border-line bg-[linear-gradient(160deg,#0d1a40,#080f2a)] p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="pill">{tenant.alias}</div>
          <h1 className="mt-5 text-3xl font-bold text-white md:text-5xl">Sign in and mark attendance securely.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-textMuted">
            This screen preserves your current BioAttend entry flow: tenant-aware branding, email or biometric sign-in, geofence-ready attendance, and role-based routing.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              { icon: Fingerprint, label: "WebAuthn biometric sign-in" },
              { icon: KeyRound, label: "Email and password fallback" },
              { icon: Shield, label: "Supabase auth with tenant claims" }
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 lg:p-10">
          <div className="section-title">Student Access</div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">Email</label>
              <input type="email" placeholder="usn@sit.ac.in" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">Password</label>
              <input type="password" placeholder="Enter password" />
            </div>
            <button className="w-full rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-4 py-3 text-sm font-semibold text-white">
              Sign In With Password
            </button>
            <button className="w-full rounded-2xl border border-line bg-panelSoft px-4 py-3 text-sm font-semibold text-textMuted hover:border-accent hover:text-accent">
              Sign In With Fingerprint / Face ID
            </button>
          </div>
          <div className="mt-6 rounded-3xl border border-line bg-panelSoft/60 p-4 text-sm text-textMuted">
            Next step after login in this SaaS version:
            <div className="mt-2 text-white">call `mark_attendance_entry(...)` with GPS coordinates and tenant-bound auth context.</div>
          </div>
          <p className="mt-6 text-sm text-textMuted">
            New here?{" "}
            <Link href={`/t/${tenant.slug}/register`} className="font-semibold text-accent">
              Create account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
