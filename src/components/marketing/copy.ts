export type LandingVariantInput = {
  src?: string;
  sub?: string;
  ab?: string;
};

export type LandingCopy = {
  nav: {
    brand: string;
    links: { label: string; href: string }[];
    cta: { label: string; href: string };
  };
  hero: {
    headline: string;
    subhead: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    trustLine: string;
    stats: { label: string; value: string }[];
  };
  problem: {
    title: string;
    cards: { quote: string; note: string }[];
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; body: string }[];
  };
  compare: {
    title: string;
    leftHeader: string;
    rightHeader: string;
    rows: { left: string; right: string }[];
  };
  features: {
    title: string;
    cards: { title: string; body: string }[];
  };
  social: {
    title: string;
    quotes: { quote: string; byline: string }[];
    trust: { title: string; bullets: string[] };
  };
  pricing: {
    title: string;
    subtitle: string;
    plans: {
      name: string;
      price: string;
      note: string;
      highlight?: boolean;
    }[];
    bullets: string[];
    cta: { label: string; href: string };
    finePrint: string;
  };
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
  footer: {
    lines: string[];
  };
};

const buildTrackedHref = (basePath: string, input: LandingVariantInput) => {
  const params = new URLSearchParams();
  if (input.src) params.set("src", input.src);
  if (input.sub) params.set("sub", input.sub);
  if (input.ab) params.set("ab", input.ab);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
};

const normalizeSub = (sub?: string) => {
  const v = (sub ?? "").toLowerCase().trim();
  if (v === "openai") return "openai";
  if (v === "saas") return "saas";
  if (v === "sideproject") return "sideproject";
  return undefined;
};

const normalizeAb = (ab?: string) => {
  const v = (ab ?? "").toLowerCase().trim();
  if (v === "heroa") return "heroA";
  if (v === "herob") return "heroB";
  return undefined;
};

export function resolveLandingCopy(input: LandingVariantInput): LandingCopy {
  const sub = normalizeSub(input.sub);
  const ab = normalizeAb(input.ab);

  const trackedLogin = buildTrackedHref("/login", { ...input, sub, ab });

  const heroHeadline =
    ab === "heroB"
      ? "Stop paying for runaway tokens."
      : "Don’t let your AI bill become your next production incident.";

  const heroSubheadBase =
    "BillGuard watches your OpenAI spend in real time and triggers a circuit breaker before you cross your budget.";

  const heroSubheadBySub: Record<NonNullable<typeof sub>, string> = {
    openai:
      "Built for OpenAI API builders: catch GPT‑4 loops, test scripts, and silent cost spikes before they hit your card.",
    saas:
      "For lean SaaS teams: get predictable AI COGS with budgets, alerts, and an automatic stop button.",
    sideproject:
      "A tiny side‑project that keeps your OpenAI spend from ruining your weekend. Fast setup, no fluff.",
  };

  const problemCardsBase = [
    {
      quote:
        "“Woke up to a $230 OpenAI charge because a retry loop never stopped.”",
      note: "Based on recent Reddit stories",
    },
    {
      quote:
        "“A test script ran overnight. Tokens kept flowing. Nobody noticed.”",
      note: "Based on recent Reddit stories",
    },
    {
      quote:
        "“My boss asked why AI costs tripled this month. I couldn’t answer.”",
      note: "Based on recent Reddit stories",
    },
  ];

  const problemCardsBySub: Partial<
    Record<NonNullable<typeof sub>, typeof problemCardsBase>
  > = {
    openai: [
      {
        quote:
          "“GPT‑4 started looping on a corner case. The bill didn’t stop.”",
        note: "Common r/OpenAI pain",
      },
      ...problemCardsBase.slice(1),
    ],
    saas: [
      {
        quote:
          "“We shipped an AI feature… then spent the week explaining COGS to finance.”",
        note: "Common r/SaaS pain",
      },
      ...problemCardsBase.slice(1),
    ],
    sideproject: [
      {
        quote:
          "“I just wanted to ship. One bug later, my weekend budget was gone.”",
        note: "Common r/SideProject pain",
      },
      ...problemCardsBase.slice(1),
    ],
  };

  const secondaryCtaLabel =
    sub === "sideproject"
      ? "See how it prevented an $800 surprise"
      : "See how it stopped an $800 bill";

  return {
    nav: {
      brand: "BillGuard",
      links: [
        { label: "How it works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
      ],
      cta: { label: "Start free trial", href: trackedLogin },
    },
    hero: {
      headline: heroHeadline,
      subhead: sub ? heroSubheadBySub[sub] : heroSubheadBase,
      primaryCta: { label: "Start free trial", href: trackedLogin },
      secondaryCta: { label: secondaryCtaLabel, href: "#how-it-works" },
      trustLine: "Encrypted API keys · No credit card · Set up in 5 minutes",
      stats: [
        { value: "80%", label: "Warn before budget" },
        { value: "$5", label: "Optional per‑call limit" },
        { value: "Realtime", label: "Spend visibility" },
      ],
    },
    problem: {
      title: "Does any of this sound familiar?",
      cards: sub ? problemCardsBySub[sub] ?? problemCardsBase : problemCardsBase,
    },
    howItWorks: {
      title: "Hit pause before your budget breaks — in 3 steps",
      subtitle:
        "No code changes required for the MVP: connect a key, set a threshold, and get protected.",
      steps: [
        {
          title: "Connect your OpenAI API key",
          body: "Paste once. It’s encrypted at rest and you can delete it anytime.",
        },
        {
          title: "Set your circuit‑breaker line (e.g. $20/day)",
          body: "Choose daily/monthly budgets and warning thresholds.",
        },
        {
          title: "Let BillGuard protect you",
          body: "When you hit the limit, BillGuard flags the key as capped and protected APIs refuse further usage.",
        },
      ],
    },
    compare: {
      title: "Not another dashboard. An automatic brake.",
      leftHeader: "What you do today",
      rightHeader: "With BillGuard",
      rows: [
        {
          left: "Manually check the Usage page",
          right: "Automated alerts only when something matters",
        },
        {
          left: "Find out after the invoice lands",
          right: "Get warned at 80% of your budget (configurable)",
        },
        {
          left: "Beg support for refunds after a bug",
          right: "Circuit breaker prevents the disaster entirely",
        },
        {
          left: "Keys scattered across scripts and teammates",
          right: "One place to see real‑time spend per key",
        },
      ],
    },
    features: {
      title: "Power features for real mistakes",
      cards: [
        {
          title: "Per‑call cost guard",
          body: "Block a single expensive call (e.g. > $5) before it turns into a chain reaction.",
        },
        {
          title: "Webhook integrations",
          body: "Send alerts to Slack/Discord/DingTalk via webhook so your team sees issues instantly.",
        },
      ],
    },
    social: {
      title: "People are already sleeping better",
      quotes: [
        {
          quote:
            "“The first night after setting BillGuard up, I slept better than I have in months.”",
          byline: "Alex · Indie developer",
        },
        {
          quote:
            "“We finally have a clear answer when someone asks why AI costs changed.”",
          byline: "Mina · SaaS operator",
        },
        {
          quote:
            "“It’s not a report. It’s the stop button we were missing.”",
          byline: "Sam · Engineer",
        },
      ],
      trust: {
        title: "How we treat your data",
        bullets: [
          "Your API key is encrypted at rest; delete anytime.",
          "We don’t store card details on our servers (Stripe handles payments).",
          "No marketing emails unless you explicitly opt in.",
        ],
      },
    },
    pricing: {
      title: "A price that pays for itself the first time you slip.",
      subtitle:
        "Start with a free trial, then pick monthly or save with annual.",
      plans: [
        { name: "Monthly", price: "$19 / month", note: "Cancel anytime" },
        {
          name: "Annual",
          price: "$190 / year",
          note: "Save $38 (equivalent to $15.8/mo)",
          highlight: true,
        },
      ],
      bullets: [
        "Unlimited API keys protected",
        "14‑day free trial, no credit card",
        "30‑day money‑back guarantee",
      ],
      cta: { label: "Start free trial", href: trackedLogin },
      finePrint:
        "Trial never auto‑charges. When the trial ends, you’ll be asked to add payment — otherwise access stops.",
    },
    faq: {
      title: "FAQ",
      items: [
        {
          q: "Is this safe? Can you steal my API key?",
          a: "Your key is encrypted at rest and never stored in plaintext. You can delete it anytime. (Optional: link to open-source security notes once published.)",
        },
        {
          q: "Will the free trial auto‑charge me?",
          a: "No. You won’t be charged automatically. We’ll email you when the trial ends and ask you to add payment to continue.",
        },
        {
          q: "Do you support Claude or Gemini?",
          a: "OpenAI is first. Anthropic and Google support are planned; annual customers will get new providers included.",
        },
      ],
    },
    footer: {
      lines: [
        "© BillGuard. Built by an independent developer.",
        "Payments secured by Stripe.",
      ],
    },
  };
}

