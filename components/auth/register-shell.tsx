"use client";

import type { TenantConfig } from "@/lib/tenant/config";

const steps = ["Basic Info", "Organization & Role", "Security & Biometric"];

export function RegisterShell({ tenant }: { tenant: TenantConfig }) {
  return (
    <div className="mx-auto max-w-5xl frame p-6 md:p-8">
      <div className="section-title">Registration Flow</div>
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className={`rounded-3xl border p-4 ${index === 0 ? "border-accent/50 bg-accent/10 text-white" : "border-line bg-panelSoft/60 text-textMuted"}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em]">Step {index + 1}</div>
              <div className="mt-2 text-sm font-semibold">{step}</div>
            </div>
          ))}
        </aside>
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <input placeholder="Full name" />
            <input type="date" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="email" placeholder="name@organization.com" />
            <input placeholder="Student / Employee ID" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={tenant.name} readOnly />
            <select defaultValue="college">
              <option value="college">College</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select defaultValue="">
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
            <input placeholder="Department" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="password" placeholder="Create password" />
            <input type="password" placeholder="Confirm password" />
          </div>
          <div className="rounded-3xl border border-accent/20 bg-accent/5 p-4">
            <div className="text-sm font-semibold text-white">Biometric-first onboarding</div>
            <p className="mt-2 text-sm leading-6 text-textMuted">
              This matches your current `handleRegisterV2()` flow: collect WebAuthn first, then create the account, then bind the credential.
            </p>
          </div>
          <button className="w-full rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-4 py-3 text-sm font-semibold text-white">
            Verify Biometric And Create Account
          </button>
        </section>
      </div>
    </div>
  );
}
