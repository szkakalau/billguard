import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const port = Number(process.env.NOTIFY_SINK_PORT ?? 4020);
const logPath = process.env.NOTIFY_SINK_LOG ?? path.join(process.cwd(), "notify-sink.log.jsonl");

function readJson(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : null);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function write(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (req.method !== "POST") return write(res, 405, { error: "method_not_allowed" });

    const body = await readJson(req).catch(() => null);
    const entry = {
      at: new Date().toISOString(),
      path: url.pathname,
      headers: {
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
      },
      body,
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");

    if (url.pathname === "/always-500") {
      return write(res, 500, { error: "forced_failure" });
    }

    return write(res, 200, { ok: true });
  } catch (e) {
    return write(res, 500, { error: (e?.message ?? String(e)).slice(0, 500) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`notify sink listening on http://127.0.0.1:${port}`);
  console.log(`logging to ${logPath}`);
});

