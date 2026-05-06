"use client";

import * as React from "react";
import Link from "next/link";
import { resolveLandingCopy, type LandingVariantInput } from "./copy";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ArrowRightIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M5 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function smoothScrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useHashScroll() {
  React.useEffect(() => {
    const handler = () => {
      const hash = window.location.hash?.slice(1);
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    handler();
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
}

function SpendPreview() {
  const [t, setT] = React.useState(0);

  React.useEffect(() => {
    const i = window.setInterval(() => setT((x) => (x + 1) % 6), 1400);
    return () => window.clearInterval(i);
  }, []);

  const percent = [48, 62, 74, 82, 88, 92][t] ?? 48;
  const triggered = percent >= 88;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-900">Realtime spend</div>
          <div className="mt-1 text-xs text-zinc-600">
            Budget line + circuit breaker preview
          </div>
        </div>
        <div
          className={cx(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            triggered
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-zinc-200 bg-zinc-50 text-zinc-700",
          )}
        >
          {triggered ? "Circuit breaker: ON" : "Monitoring"}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>Today</span>
          <span>$20/day</span>
        </div>
        <div className="mt-2 relative h-3 rounded-full bg-zinc-100">
          <div
            className={cx(
              "h-3 rounded-full transition-all duration-700",
              triggered ? "bg-red-600" : "bg-zinc-900",
            )}
            style={{ width: `${percent}%` }}
          />
          <div className="absolute inset-y-0 right-[20%] w-[2px] bg-red-500/60" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-tight">
            ${(20 * (percent / 100)).toFixed(2)}
          </div>
          <div className="text-xs text-zinc-600">
            {triggered ? "Requests blocked after cap" : "Safe margin remaining"}
          </div>
        </div>
      </div>

      <div
        className={cx(
          "mt-5 rounded-xl border px-4 py-3 text-sm",
          triggered
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-zinc-200 bg-zinc-50 text-zinc-800",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">
            {triggered ? "🔴 Cap reached. Usage stopped." : "Budget guard armed."}
          </div>
          <div className="text-xs text-zinc-600">
            {triggered ? "Alert sent" : "No action needed"}
          </div>
        </div>
        <div className="mt-1 text-xs text-zinc-700/80">
          {triggered
            ? "BillGuard flags the key as capped and protected endpoints refuse further usage."
            : "Get warned at 80% and stop before it becomes a surprise invoice."}
        </div>
      </div>
    </div>
  );
}

function SectionShell(props: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={props.id} className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-2xl">
          {props.eyebrow ? (
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {props.eyebrow}
            </div>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {props.title}
          </h2>
          {props.subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              {props.subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-8">{props.children}</div>
      </div>
    </section>
  );
}

export function LandingPage(props: { variant: LandingVariantInput }) {
  useHashScroll();
  const copy = React.useMemo(() => resolveLandingCopy(props.variant), [props.variant]);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              {copy.nav.brand}
            </Link>
            <nav className="hidden items-center gap-4 text-sm text-zinc-600 sm:flex">
              {copy.nav.links.map((l) => (
                <a key={l.href} href={l.href} className="hover:text-zinc-900">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <Link
            href={copy.nav.cta.href}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {copy.nav.cta.label}
          </Link>
        </div>
      </header>

      <main>
        <section className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                {copy.hero.headline}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
                {copy.hero.subhead}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={copy.hero.primaryCta.href}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  {copy.hero.primaryCta.label}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => smoothScrollToId("how-it-works")}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  {copy.hero.secondaryCta.label}
                </button>
              </div>

              <div className="mt-4 text-xs text-zinc-600">{copy.hero.trustLine}</div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {copy.hero.stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="text-lg font-semibold tracking-tight">
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:pl-6">
              <SpendPreview />
            </div>
          </div>
        </section>

        <SectionShell title={copy.problem.title}>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.problem.cards.map((c, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="text-sm leading-relaxed text-zinc-900">{c.quote}</div>
                <div className="mt-3 text-xs font-medium text-red-600">{c.note}</div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="how-it-works"
          eyebrow="How it works"
          title={copy.howItWorks.title}
          subtitle={copy.howItWorks.subtitle}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.howItWorks.steps.map((s, idx) => (
              <div
                key={s.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white">
                    {idx + 1}
                  </span>
                  Step {idx + 1}
                </div>
                <div className="mt-4 text-base font-semibold tracking-tight">
                  {s.title}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {s.body}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">See it in action</div>
                <div className="mt-1 text-xs text-zinc-600">
                  Preview of the budget line turning red and triggering a stop.
                </div>
              </div>
              <Link
                href={copy.hero.primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {copy.hero.primaryCta.label}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4">
              <SpendPreview />
            </div>
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Why BillGuard"
          title={copy.compare.title}
          subtitle="Most tools show numbers after the fact. BillGuard is designed to prevent surprises."
        >
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="grid grid-cols-2 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              <div>{copy.compare.leftHeader}</div>
              <div>{copy.compare.rightHeader}</div>
            </div>
            <div className="divide-y divide-zinc-200">
              {copy.compare.rows.map((r, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-2">
                  <div className="text-sm text-zinc-800">{r.left}</div>
                  <div className="text-sm font-medium text-zinc-900">{r.right}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Features"
          title={copy.features.title}
          subtitle="Built around the mistakes that actually happen: loops, retries, and forgotten scripts."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {copy.features.cards.map((c) => (
              <div key={c.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="text-base font-semibold tracking-tight">{c.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600">{c.body}</div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Trust"
          title={copy.social.title}
          subtitle="Social proof is strongest when it’s specific. Start small and keep it real."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {copy.social.quotes.map((q, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="text-sm leading-relaxed text-zinc-900">{q.quote}</div>
                <div className="mt-4 text-xs font-medium text-zinc-600">{q.byline}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold">{copy.social.trust.title}</div>
            <ul className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              {copy.social.trust.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-zinc-900" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionShell>

        <SectionShell
          id="pricing"
          eyebrow="Pricing"
          title={copy.pricing.title}
          subtitle={copy.pricing.subtitle}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {copy.pricing.plans.map((p) => (
              <div
                key={p.name}
                className={cx(
                  "rounded-2xl border bg-white p-6",
                  p.highlight ? "border-zinc-900" : "border-zinc-200",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight">
                      {p.price}
                    </div>
                    <div className="mt-2 text-sm text-zinc-600">{p.note}</div>
                  </div>
                  {p.highlight ? (
                    <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                      Best value
                    </div>
                  ) : null}
                </div>

                <div className="mt-6">
                  <Link
                    href={copy.pricing.cta.href}
                    className={cx(
                      "inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium",
                      p.highlight
                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                        : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                    )}
                  >
                    {copy.pricing.cta.label}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            <ul className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              {copy.pricing.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 text-zinc-900" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-zinc-600">{copy.pricing.finePrint}</div>
          </div>
        </SectionShell>

        <SectionShell id="faq" eyebrow="FAQ" title={copy.faq.title}>
          <div className="grid gap-4 lg:grid-cols-2">
            {copy.faq.items.map((it) => (
              <div key={it.q} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="text-sm font-semibold text-zinc-900">{it.q}</div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600">{it.a}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-900 p-8 text-white">
            <div className="text-2xl font-semibold tracking-tight">
              Ready to stop the next surprise bill?
            </div>
            <div className="mt-2 text-sm text-white/80">
              Start free. Connect a key. Set a budget. Sleep better.
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={copy.hero.primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                {copy.hero.primaryCta.label}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => smoothScrollToId("pricing")}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                View pricing
              </button>
            </div>
          </div>
        </SectionShell>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="text-sm font-semibold">{copy.nav.brand}</div>
          <div className="mt-3 grid gap-1 text-xs text-zinc-600">
            {copy.footer.lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

