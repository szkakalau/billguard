export async function sendSlackWebhook(params: {
  webhookUrl: string;
  text: string;
}) {
  const res = await fetch(params.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: params.text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Slack webhook failed: ${res.status} ${body}`);
  }
}

