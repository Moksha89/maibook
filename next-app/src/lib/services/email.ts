import "server-only";

export async function sendEmail(input: { to: string; subject: string; text: string; attachments?: { filename: string; content: string; type: string }[] }) {
  if (process.env.EMAIL_DELIVERY_ENABLED !== "true") throw new Error("Email delivery is disabled in this environment.");
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("SendGrid is not configured.");
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ personalizations: [{ to: [{ email: input.to }] }], from: { email: from }, subject: input.subject, content: [{ type: "text/plain", value: input.text }], attachments: input.attachments?.map((item) => ({ filename: item.filename, content: item.content, type: item.type, disposition: "attachment" })) }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`SendGrid returned ${response.status}.`);
}
