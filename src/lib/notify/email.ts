import { Resend } from "resend";

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}) {
  const sinkUrl = process.env.NOTIFY_EMAIL_SINK_URL;
  if (sinkUrl) {
    const res = await fetch(sinkUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Email sink failed: ${res.status} ${body}`);
    }
    return { skipped: false as const, sink: true as const };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return { skipped: true as const };

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });

  return { skipped: false as const };
}

