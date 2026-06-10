import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
import OpenAI from "openai";

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
