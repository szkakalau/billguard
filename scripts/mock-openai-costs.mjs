import http from "node:http";
import { URL } from "node:url";

const port = Number(process.env.MOCK_OPENAI_PORT ?? 4010);
const slowMs = Number(process.env.MOCK_OPENAI_SLOW_MS ?? 9000);

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function makeBuckets({ startTime, endTime }) {
  const startDay = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));
  const endDay = new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate()));

  const buckets = [];
  for (let d = new Date(startDay); d <= endDay; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    const start = Math.floor(d.getTime() / 1000);
    const end = start + 24 * 60 * 60;

    // 固定每天 $0.60，用来触发预算熔断
    buckets.push({
      object: "bucket",
      start_time: start,
      end_time: end,
      results: [
        {
          object: "organization.costs.result",
          amount: { value: 0.6, currency: "usd" },
        },
      ],
    });
  }
  return buckets;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (req.method !== "GET") return json(res, 405, { error: "method_not_allowed" });

  if (u.pathname === "/v1/organization/costs") {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Bearer ")) return json(res, 401, { error: "missing_bearer" });
    const token = auth.slice("Bearer ".length).trim();

    // Failure simulation by token prefix:
    // - "fail401" => 401
    // - "fail500" => 500
    // - "slow"    => delay (to trigger AbortError in callers)
    if (token.startsWith("fail401")) return json(res, 401, { error: "simulated_unauthorized" });
    if (token.startsWith("fail500")) return json(res, 500, { error: "simulated_server_error" });
    if (token.startsWith("slow")) {
      await new Promise((r) => setTimeout(r, slowMs));
    }

    const start = Number(u.searchParams.get("start_time") ?? "0");
    const end = Number(u.searchParams.get("end_time") ?? "0");
    const startTime = new Date(start * 1000);
    const endTime = new Date(end * 1000);

    const data = makeBuckets({ startTime, endTime });
    return json(res, 200, { object: "list", data, has_more: false, next_page: null });
  }

  return json(res, 404, { error: "not_found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock openai costs listening on http://127.0.0.1:${port}`);
});

