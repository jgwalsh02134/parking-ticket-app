import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
import OpenAI from "openai";

// xAI's API is OpenAI-compatible — same SDK, different base URL.
// https://docs.x.ai/developers/models — "grok-4.3" is the current flagship.
function xaiClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
  });
}
const XAI_MODEL = () => process.env.XAI_MODEL || "grok-4.3";

// The 8 situation ids the wizard offers (must stay in sync with
// client/src/lib/appeal.ts SITUATIONS). The AI only ever picks from this list —
// all legal content stays in the curated, source-verified DEFENSES table.
const SITUATION_IDS = [
  "paid", "wrongplate", "signage", "meter", "notmine", "facts", "medical", "other",
] as const;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Extract structured ticket fields from an uploaded photo of a parking ticket.
  // Accepts { image: "data:image/...;base64,..." } and returns best-effort fields.
  //
  // PORTABILITY: photo auto-fill needs a vision model. On a self-hosted deploy
  // (Railway, Render, Fly, a VPS, etc.) set OPENAI_API_KEY in the environment and
  // this endpoint calls OpenAI directly (gpt-4o). If no key is set, the endpoint
  // responds gracefully (ok:false, unavailable:true) so the UI simply asks the
  // user to type the fields in — the rest of the app works without it.
  app.post("/api/extract-ticket", async (req: Request, res: Response) => {
    try {
      const { image } = req.body as { image?: string };
      if (!image || typeof image !== "string" || !image.startsWith("data:")) {
        return res.status(400).json({ error: "Provide a base64 data-URL image." });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.json({
          ok: false,
          unavailable: true,
          fields: {},
          message: "Photo reading isn't configured on this server. Please enter the ticket details by hand.",
        });
      }

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const instruction = [
        "You are reading a photo of a parking ticket or parking violation notice, most likely from the City of Albany, New York.",
        "Extract the fields below from the image. Return ONLY a compact JSON object, no prose, with these keys:",
        '{ "ticket": string, "vdate": "YYYY-MM-DD", "vtime": string, "location": string, "plate": string, "state": string, "make": string, "model": string, "violation": string, "amount": string, "is_camera": boolean }',
        "Rules:",
        "- ticket: the citation / ticket number.",
        "- vdate: the violation date in YYYY-MM-DD. Convert any format. If only partial, leave empty string.",
        "- location: street address or block where the ticket was issued.",
        "- plate / state: license plate and its state.",
        "- make / model: vehicle make and model if shown.",
        "- violation: the violation description / code text.",
        "- amount: the fine amount as shown (e.g. '$30').",
        "- is_camera: true if this is a red-light (RLC) or school-zone-speed (SZS) camera violation, else false.",
        "- For any field you cannot read, use an empty string (or false for is_camera).",
        "Return strictly valid JSON.",
      ].join("\n");

      // Standard OpenAI Chat Completions vision format — works against the public
      // OpenAI API on any host.
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      } as any);

      const text: string = completion.choices?.[0]?.message?.content ?? "";
      let data: Record<string, unknown> = {};
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { data = JSON.parse(match[0]); } catch { data = {}; }
      }
      return res.json({ ok: true, fields: data, raw: text });
    } catch (err: any) {
      console.error("extract-ticket error:", err?.message || err);
      return res.status(500).json({
        error: "Could not read the ticket image. You can still enter the details manually.",
      });
    }
  });

  // Match a resident's plain-English description of what happened to one of the
  // wizard's 8 curated situations. The model ONLY classifies into the fixed list —
  // it never generates legal arguments, citations, or policy facts (those live in
  // the hand-verified DEFENSES table on the client). Uses the xAI (Grok) API.
  // Degrades gracefully when XAI_API_KEY is unset.
  app.post("/api/suggest-situation", async (req: Request, res: Response) => {
    try {
      const { description } = req.body as { description?: string };
      if (!description || typeof description !== "string" || description.trim().length < 10) {
        return res.status(400).json({ error: "Describe what happened in a sentence or two." });
      }
      if (description.length > 2000) {
        return res.status(400).json({ error: "Description is too long (max 2000 characters)." });
      }

      const client = xaiClient();
      if (!client) {
        return res.json({
          ok: false,
          unavailable: true,
          message: "AI matching isn't configured on this server. Please pick the situation that fits best.",
        });
      }

      const instruction = [
        "A City of Albany, NY resident is contesting a parking ticket and described what happened in their own words.",
        "Classify their description into EXACTLY ONE of these situation ids:",
        '- "paid": they paid for parking (meter or Park Albany app) but were ticketed anyway',
        '- "wrongplate": the plate, make, state, or vehicle on the ticket does not match their car',
        '- "signage": the regulating sign was missing, knocked down, obscured, or conflicting',
        '- "meter": the meter or pay station was broken or would not accept payment',
        '- "notmine": they did not own or drive the car at the time (sold, rented out, or stolen)',
        '- "facts": the facts written on the ticket are wrong (wrong date, time, location, or description)',
        '- "medical": a genuine medical emergency or sudden vehicle breakdown',
        '- "other": none of the above clearly fits',
        "Return ONLY a compact JSON object, no prose:",
        '{ "situation": "<one id from the list>", "confidence": "high"|"medium"|"low", "reason": "<one short sentence, addressed to the resident, explaining why this fits>" }',
        "Rules: never invent facts the resident did not state; if the description is vague or fits nothing, use \"other\" with low confidence.",
        "",
        "Resident's description:",
        description.trim(),
      ].join("\n");

      const completion = await client.chat.completions.create({
        model: XAI_MODEL(),
        messages: [{ role: "user", content: instruction }],
        max_tokens: 300,
        temperature: 0.2,
      });

      const text: string = completion.choices?.[0]?.message?.content ?? "";
      let data: Record<string, unknown> = {};
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { data = JSON.parse(match[0]); } catch { data = {}; }
      }
      const situation = SITUATION_IDS.includes(data.situation as any)
        ? (data.situation as string)
        : "other";
      const confidence = ["high", "medium", "low"].includes(data.confidence as any)
        ? (data.confidence as string)
        : "low";
      const reason = typeof data.reason === "string" ? data.reason.slice(0, 300) : "";
      return res.json({ ok: true, situation, confidence, reason });
    } catch (err: any) {
      console.error("suggest-situation error:", err?.message || err);
      return res.status(500).json({
        error: "Couldn't match your description automatically. Please pick the situation that fits best.",
      });
    }
  });

  // Polish the resident's appeal / FOIL letter with the xAI (Grok) API: tighten
  // wording and improve tone WITHOUT changing any facts. The prompt hard-forbids
  // adding, removing, or altering facts, dates, amounts, names, and legal
  // citations — the model is a copy editor, never a source of legal content.
  // Degrades gracefully when XAI_API_KEY is unset.
  app.post("/api/polish-letter", async (req: Request, res: Response) => {
    try {
      const { letter } = req.body as { letter?: string };
      if (!letter || typeof letter !== "string" || letter.trim().length < 80) {
        return res.status(400).json({ error: "Provide the full letter text to polish." });
      }
      if (letter.length > 20000) {
        return res.status(400).json({ error: "Letter is too long (max 20000 characters)." });
      }

      const client = xaiClient();
      if (!client) {
        return res.json({
          ok: false,
          unavailable: true,
          message: "AI polish isn't configured on this server. Your letter is ready to send as-is.",
        });
      }

      const instruction = [
        "You are a careful copy editor. Improve the plain-text letter below — a City of Albany, NY parking-ticket appeal or records request — for clarity, flow, and a respectful, confident tone.",
        "HARD RULES — breaking any of these makes the output unusable:",
        "1. Do NOT add, remove, or change any fact: dates, times, amounts, ticket numbers, plates, addresses, names, or events.",
        "2. Do NOT add any legal citation, statute, case, or rule that is not already in the letter. Reproduce every existing citation VERBATIM, character for character.",
        "3. Do NOT invent evidence, claims, or circumstances the writer did not state.",
        "4. Keep it plain text (no markdown), keep the letter structure (date, address block, RE line, salutation, body, sign-off), and keep roughly the same length.",
        "5. Never admit the violation on the writer's behalf.",
        "Return ONLY the polished letter text — no commentary, no preamble.",
        "",
        "Letter:",
        letter,
      ].join("\n");

      const completion = await client.chat.completions.create({
        model: XAI_MODEL(),
        messages: [{ role: "user", content: instruction }],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const polished = (completion.choices?.[0]?.message?.content ?? "").trim();
      if (polished.length < 80) {
        return res.status(500).json({ error: "Couldn't polish the letter. Your original is ready to send as-is." });
      }
      return res.json({ ok: true, letter: polished });
    } catch (err: any) {
      console.error("polish-letter error:", err?.message || err);
      return res.status(500).json({
        error: "Couldn't polish the letter right now. Your original is ready to send as-is.",
      });
    }
  });

  // Submit a FOIL request. The City of Albany receives FOIL requests by email to
  // the City Clerk (Records Access Officer) at clerk@albanyny.gov or via its
  // CivicPlus/GovQA online portal. We log the request server-side so there is a
  // record, and report whether we delivered it directly. No verified outbound
  // SMTP credential is configured here, so we return delivered=false and the
  // client completes submission via the pre-filled email channel (the genuine,
  // working submission path) and/or the official portal.
  app.post("/api/submit-foil", async (req: Request, res: Response) => {
    try {
      const { ticket, name, email, recipient, format, letter } = req.body as {
        ticket?: string; name?: string; email?: string;
        recipient?: string; format?: string; letter?: string;
      };
      if (!letter || typeof letter !== "string" || letter.trim().length < 20) {
        return res.status(400).json({ ok: false, error: "Missing FOIL letter content." });
      }

      const to = recipient || "clerk@albanyny.gov";
      // Server-side record of the submission attempt.
      console.log(
        "[submit-foil]",
        JSON.stringify({
          at: new Date().toISOString(),
          to,
          ticket: ticket || null,
          requester: { name: name || null, email: email || null },
          format: format || null,
          letterChars: letter.length,
        })
      );

      // If a real outbound email channel were configured, we'd send here and set
      // delivered=true. Until then, the client finishes via the mailto channel.
      const delivered = false;
      return res.json({
        ok: true,
        delivered,
        recipient: to,
        message: delivered
          ? "FOIL request delivered to the City Clerk (Records Access Officer)."
          : "FOIL request prepared; complete submission via email or the official portal.",
      });
    } catch (err: any) {
      console.error("submit-foil error:", err?.message || err);
      return res.status(500).json({ ok: false, error: "Could not submit the FOIL request." });
    }
  });

  return httpServer;
}
