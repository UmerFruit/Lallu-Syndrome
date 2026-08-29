// supabase/functions/feedback-email/index.ts
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL")!; // must be verified in Brevo
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") ?? "Lallu Syndrome";
const FEEDBACK_TO_EMAIL = Deno.env.get("FEEDBACK_TO_EMAIL")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Best-effort sliding window (per instance). Honeypot is the real guard.
const RATE_WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const recentRequests: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  while (recentRequests.length > 0 && now - recentRequests[0]! > RATE_WINDOW_MS) {
    recentRequests.shift();
  }
  if (recentRequests.length >= MAX_PER_WINDOW) return true;
  recentRequests.push(now);
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const firstName = typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const lastName = typeof payload.lastName === "string" ? payload.lastName.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const category = payload.category;
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const website = payload.website;

  // Honeypot: bots fill the hidden field — pretend success and drop it.
  if (typeof website === "string" && website.length > 0) {
    return jsonResponse({ success: true }, 200);
  }

  if (!firstName || !lastName || !message) {
    return jsonResponse({ error: "firstName, lastName and message are required." }, 400);
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return jsonResponse({ error: "Name is too long." }, 400);
  }
  if (category !== "bug" && category !== "feature") {
    return jsonResponse({ error: "category must be 'bug' or 'feature'." }, 400);
  }
  if (message.length > 5000) {
    return jsonResponse({ error: "Message is too long." }, 400);
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return jsonResponse({ error: "Invalid email address." }, 400);
  }
  if (isRateLimited()) {
    return jsonResponse({ error: "Too many requests. Try again in a minute." }, 429);
  }

  const name = `${firstName} ${lastName}`;
  const isBug = category === "bug";
  const tag = isBug ? "Bug" : "Feature";
  const subject = `[${tag}] ${name}`;
  const submittedAt = new Date().toISOString();

  const textContent = [
    `New ${isBug ? "bug report" : "feature request"} from Lallu Syndrome`,
    "",
    `From: ${name}${email ? ` <${email}>` : " (no email provided)"}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  const htmlContent = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#181818;">
      <span style="font-family:monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#B00000;border:1px solid #B00000;display:inline-block;padding:4px 8px;border-radius:4px;">[${tag}]</span>
      <h2 style="font-size:20px;margin:16px 0 8px;">${safeName}</h2>
      <p style="color:#626262;font-size:14px;margin:0 0 20px;">
        ${email ? `Email: <a href="mailto:${escapeHtml(email)}" style="color:#B00000;">${escapeHtml(email)}</a><br />` : "No email provided.<br />"}
        Submitted: ${submittedAt}
      </p>
      <div style="border-top:1px solid #E8E8E4;padding-top:16px;font-size:15px;line-height:1.7;">
        ${safeMessage}
      </div>
    </div>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: FEEDBACK_TO_EMAIL, name: "Lallu Syndrome" }],
      ...(email ? { replyTo: { email, name } } : {}),
      subject,
      textContent,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Brevo error:", res.status, body);
    return jsonResponse({ error: "Failed to send feedback email." }, 500);
  }

  return jsonResponse({ success: true }, 200);
});