type CostsBucket = {
  object: "bucket";
  start_time: number;
  end_time: number;
  results: Array<{
    object: "organization.costs.result";
    amount?: { value?: number; currency?: string } | null;
    line_item?: string | null;
    project_id?: string | null;
    organization_id?: string | null;
  }>;
};

type CostsResponse = {
  object: string;
  data: CostsBucket[];
  has_more?: boolean;
  next_page?: string | null;
};

export type DailyCost = {
  date: Date;
  costUsd: number;
  raw: unknown;
};

async function fetchJsonWithTimeout(
  url: string,
  apiKey: string,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`OpenAI costs API failed: ${res.status} ${text}`);
    }
    return JSON.parse(text) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

function asCostsResponse(x: unknown): CostsResponse {
  return x as CostsResponse;
}

/**
 * Fetch organization total costs, bucketed daily.
 * OpenAI endpoint: GET /v1/organization/costs
 */
export async function fetchDailyOrgCosts(params: {
  apiKey: string;
  startTime: Date;
  endTime: Date;
  timeoutMs?: number;
}): Promise<DailyCost[]> {
  const start = Math.floor(params.startTime.getTime() / 1000);
  const end = Math.floor(params.endTime.getTime() / 1000);
  const timeoutMs = params.timeoutMs ?? 8000;

  const base = process.env.OPENAI_API_BASE_URL ?? "https://api.openai.com";
  const url = new URL("/v1/organization/costs", base);
  url.searchParams.set("start_time", String(start));
  url.searchParams.set("end_time", String(end));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", "180");

  const json = await fetchJsonWithTimeout(url.toString(), params.apiKey, timeoutMs);
  const data = asCostsResponse(json).data ?? [];

  return data.map((bucket) => {
    const costUsd =
      bucket.results?.reduce((sum, r) => sum + (r.amount?.value ?? 0), 0) ?? 0;

    return {
      date: new Date(bucket.start_time * 1000),
      costUsd,
      raw: bucket,
    };
  });
}

