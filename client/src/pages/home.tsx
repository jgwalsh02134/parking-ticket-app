import { useState, useMemo, useRef, useEffect } from "react";
import {
  Shield, Sun, Moon, Check, Clock, Info, Mail, Copy, MapPin, Upload,
  Receipt, Car, Signpost, ParkingMeter, FileText, TriangleAlert, HeartPulse,
  MessageSquare, Loader2, X, CheckCircle2, Scale, ExternalLink,
  FolderOpen, FileSearch, Send, ArrowLeft, Printer, Gavel,
  Search, Camera, Building2, Sparkles, Undo2,
  Lock, RotateCcw, ArrowRight, Paperclip, ScanLine,
} from "lucide-react";
import { apiRequest, apiRequestRaw } from "@/lib/queryClient";
import { storageAvailable, loadState, saveState, clearState } from "@/lib/persist";
import {
  TicketForm, emptyForm, SITUATIONS, DEFENSES, strengthLabel,
  fmtDate, deadlineInfo, buildLetter, BUREAU_AUTHORITY,
  buildDismissalLetter, buildDemandProofLetter,
  FoilForm, emptyFoil, FOIL_RECORDS, suggestedFoilRecords,
  FOIL_AUTHORITY, FOIL_CONTACT, buildFoilLetter,
  FoilAppealForm, emptyFoilAppeal, FOIL_APPEAL_REASONS, FoilAppealReason,
  FOIL_APPEAL_AUTHORITY, FOIL_APPEAL_CONTACT, buildFoilAppealLetter,
  LOOKUP_STATES, LOOKUP_PORTAL, resolveLookupState,
} from "@/lib/appeal";
import TicketScan from "@/components/ticket-scan";
import { toLetterGrounds, parseCitationText, captureCoverage, type ScanResult, type ScanField } from "@/lib/ticketScan";

const ICONS: Record<string, any> = {
  Receipt, Car, Signpost, ParkingMeter, FileText, TriangleAlert, HeartPulse, MessageSquare,
};

// Wizard stages. The Scan stage (dismissal-first error scan) is the core
// defense-discovery step, inserted between Situation and Defense.
const STEP = { TICKET: 0, SITUATION: 1, SCAN: 2, DEFENSE: 3, APPEAL: 4 } as const;
const STEPS = ["Ticket", "Situation", "Scan", "Defense", "Appeal"];
type LetterMode = "situation" | "dismissal" | "demand";

// Print a plain-text letter as a clean, printable page the browser can save as PDF.
// Works inside the sandboxed iframe by writing into a hidden iframe and printing it.
function printLetter(text: string, title: string) {
  const existing = document.getElementById("__print_frame__");
  if (existing) existing.remove();
  const frame = document.createElement("iframe");
  frame.id = "__print_frame__";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) return;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>
      @page { margin: 1in; }
      html,body { margin:0; padding:0; background:#fff; }
      body { font-family: 'Times New Roman', Georgia, serif; color:#111; }
      pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit;
            font-size: 12pt; line-height: 1.5; margin:0; }
    </style></head><body><pre>${esc(text)}</pre></body></html>`);
  doc.close();
  const win = frame.contentWindow;
  if (!win) return;
  // Give the iframe a tick to lay out before printing.
  setTimeout(() => { win.focus(); win.print(); }, 150);
}

function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return [dark, () => setDark((d) => !d)] as const;
}

// Single source of truth for the "Not legal advice" disclaimer so it can render
// in both the footer and the Appeal step without duplicating/rewording the
// legal substance. Edit the wording here only.
function LegalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={className} data-testid="text-legal-disclaimer">
      <b>Not legal advice.</b> This free tool helps Albany residents prepare a parking-ticket appeal using the City's published Parking Violations Bureau rules.
      It does not create an attorney-client relationship and does not guarantee a result. Deadlines are calculated from the violation date you enter — always confirm the date on your ticket.
      Public-safety violations (fire hydrant, handicapped, crosswalk, obstruction, red-light and school-zone cameras) face a higher standard and are not voided without solid proof.
      For anything serious or for a hearing, consider consulting a licensed New York attorney.
    </p>
  );
}

export default function Home() {
  const [dark, toggleDark] = useDark();

  // Resume-after-close: best-effort, client-only. storageAvailable() is false
  // in sandboxed iframes where localStorage throws, so the whole feature
  // (restore + autosave + the "Start over" control) cleanly disables itself.
  const canPersist = useMemo(() => storageAvailable(), []);
  const restored = useMemo(() => (canPersist ? loadState() : null), [canPersist]);
  const [hasSaved, setHasSaved] = useState(() => restored != null);

  const [step, setStep] = useState<number>(restored?.step ?? 0);
  const [sit, setSit] = useState<string | null>(restored?.sit ?? null);
  // Merge over the empty defaults so an older stored blob missing newer fields
  // can't produce undefined-field crashes (VERSION already gates big changes).
  const [f, setF] = useState<TicketForm>(
    restored?.f ? { ...emptyForm, ...(restored.f as Partial<TicketForm>) } : emptyForm
  );
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Step 0 inline validation: only show field errors after a continue attempt.
  const [triedContinue, setTriedContinue] = useState(false);
  // Hero CTA target — smooth-scroll/focus the first required field.
  const ticketRef = useRef<HTMLInputElement>(null);
  // Screenshot/photo upload trigger inside the scan sourcing panel.
  const sourceFileRef = useRef<HTMLInputElement>(null);

  // FOIL feature state
  const [foilMode, setFoilMode] = useState(false);
  const [foil, setFoil] = useState<FoilForm>(
    restored?.foil ? { ...emptyFoil, ...(restored.foil as Partial<FoilForm>) } : emptyFoil
  );
  const [foilCopied, setFoilCopied] = useState(false);
  const [foilSubmitting, setFoilSubmitting] = useState(false);
  const [foilSubmitMsg, setFoilSubmitMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // FOIL denial-appeal state
  const [appealMode, setAppealMode] = useState(false);
  const [fap, setFap] = useState<FoilAppealForm>(
    restored?.fap ? { ...emptyFoilAppeal, ...(restored.fap as Partial<FoilAppealForm>) } : emptyFoilAppeal
  );
  const [fapCopied, setFapCopied] = useState(false);

  // Check my open tickets (official portal hand-off). The portal accepts three
  // resident-facing lookup methods; we collect the value, copy it, and hand off.
  const [lookupMode, setLookupMode] = useState(false);
  const [lkMethod, setLkMethod] = useState<"plate" | "citation" | "vin">("plate");
  const [lkPlate, setLkPlate] = useState("");
  const [lkState, setLkState] = useState("NY");
  const [lkCitation, setLkCitation] = useState("");
  const [lkVin, setLkVin] = useState("");
  const [lkCopied, setLkCopied] = useState(false);

  // AI situation matcher (xAI Grok) — classifies a plain-English description
  // into one of the 8 curated situations. Never generates legal content.
  const [aiDesc, setAiDesc] = useState("");
  const [aiMatching, setAiMatching] = useState(false);
  const [aiMatchMsg, setAiMatchMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // AI letter polish (xAI Grok) — copy-edits the generated letter; facts and
  // citations are preserved, and the resident can revert to the original.
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState<string | null>(null);
  const [polishMsg, setPolishMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Dismissal-first Ticket Error Scan → letter wiring. letterMode decides which
  // builder the Appeal step uses; scanResult holds the confirmed grounds.
  const [letterMode, setLetterMode] = useState<LetterMode>("situation");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  // User-assisted sourcing gate before the scan, plus values for scan-only
  // fields (plate type, body type, etc.) the user pulled/typed.
  const [scanSourced, setScanSourced] = useState(restored?.scanSourced ?? false);
  const [scanValues, setScanValues] = useState<Record<string, string>>(restored?.scanValues ?? {});
  const [pasteText, setPasteText] = useState("");
  const [parseMsg, setParseMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Set after a successful screenshot/PDF capture so we can show a coverage
  // report (what the capture included / missed + how to retake).
  const [captured, setCaptured] = useState(false);
  const coverage = useMemo(() => captureCoverage(f, scanValues), [f, scanValues]);

  const setField = (k: keyof TicketForm) => (e: any) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const { days, deadline, daysLeft } = useMemo(() => deadlineInfo(f), [f.vdate, f.isCamera]);
  const def = sit ? DEFENSES[sit] : null;
  const scanGrounds = useMemo(() => (scanResult ? toLetterGrounds(scanResult) : []), [scanResult]);
  // The appeal letter is built from whichever path the user took: a dismissal
  // built around scan grounds, a deadline-driven demand-for-proof, or the
  // situation-picker fallback.
  const letter = useMemo(() => {
    if (letterMode === "dismissal" && scanGrounds.length) return buildDismissalLetter(f, scanGrounds);
    if (letterMode === "demand") return buildDemandProofLetter(f);
    return sit ? buildLetter(f, sit) : "";
  }, [letterMode, scanGrounds, f, sit]);
  // A polished version goes stale the moment the underlying letter changes.
  useEffect(() => { setPolished(null); setPolishMsg(null); }, [letter]);
  const displayLetter = polished ?? letter;
  const canStep1 = f.ticket && f.vdate;

  // Hand-off from the scan: set the letter strategy and move to the Defense step.
  const onScanProceed = (mode: LetterMode) => {
    setLetterMode(mode);
    setStep(STEP.DEFENSE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // A scan field the user supplies from their own knowledge writes to the real
  // form (for fields that have a slot) or to scanValues (scan-only fields).
  const onProvideScanValue = (field: ScanField, value: string) => {
    if (field.formField) setF((p) => ({ ...p, [field.formField as keyof TicketForm]: value }));
    else setScanValues((p) => ({ ...p, [field.id]: value }));
  };

  // Parse pasted citation-detail text on-device (never fetch the portal).
  const parsePastedCitation = () => {
    setUploadMsg(null);
    const { form, scanValues: sv } = parseCitationText(pasteText);
    const formKeys = Object.keys(form);
    const svKeys = Object.keys(sv);
    if (!formKeys.length && !svKeys.length) {
      setParseMsg({ kind: "err", text: "Couldn't recognize any fields. Make sure you pasted the citation detail (with labels like Plate, Make, Date), or use the screenshot option." });
      return;
    }
    setF((p) => ({ ...p, ...form }));
    setScanValues((p) => ({ ...p, ...sv }));
    setParseMsg({ kind: "ok", text: `Captured ${formKeys.length + svKeys.length} field${formKeys.length + svKeys.length === 1 ? "" : "s"}. Anything not shown will be left blank — we never guess.` });
  };
  const foilLetter = useMemo(() => buildFoilLetter(f, sit || "", foil), [f, sit, foil]);

  // Autosave in-progress work to the browser (never to a server). No-ops when
  // storage is unavailable. Marks that there's resumable state so the
  // "Start over" control can appear.
  useEffect(() => {
    if (!canPersist) return;
    saveState({ step, sit, f, foil, fap, scanValues, scanSourced });
    setHasSaved(true);
  }, [canPersist, step, sit, f, foil, fap, scanValues, scanSourced]);

  // Smooth-scroll to and focus the first ticket field (hero CTA).
  const focusTicket = () => {
    ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => ticketRef.current?.focus(), 300);
  };

  // Attempt to advance past step 0; surface inline errors if required fields
  // are missing (keeps the disabled-look button as a secondary cue).
  const tryContinueStep1 = () => {
    if (canStep1) { setTriedContinue(false); setStep(1); }
    else setTriedContinue(true);
  };

  const openFoil = () => {
    // Pre-check the records that match the resident's situation.
    setFoil((p) => (p.records.length ? p : { ...p, records: suggestedFoilRecords(sit) }));
    setFoilSubmitMsg(null);
    setFoilMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeFoil = () => { setFoilMode(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleFoilRecord = (id: string) =>
    setFoil((p) => ({ ...p, records: p.records.includes(id) ? p.records.filter((r) => r !== id) : [...p.records, id] }));

  // FOIL denial-appeal helpers
  const foilAppealLetter = useMemo(() => buildFoilAppealLetter(f, fap), [f, fap]);
  const openAppeal = () => { setAppealMode(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const closeAppeal = () => { setAppealMode(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // Check my open tickets — guided hand-off to the official City portal.
  const openLookup = () => {
    // Carry over anything the resident already typed into the wizard.
    if (f.plate && !lkPlate) setLkPlate(f.plate);
    const resolved = resolveLookupState(f.state);
    if (resolved) setLkState(resolved.abbr);
    setLookupMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeLookup = () => { setLookupMode(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const lkResolvedState = resolveLookupState(lkState);
  // The single value the resident copies depends on the chosen lookup method.
  const lkValue =
    lkMethod === "plate" ? lkPlate.trim().toUpperCase()
    : lkMethod === "citation" ? lkCitation.trim()
    : lkVin.trim().toUpperCase();
  // Plate lookups also need a state picked from the portal dropdown.
  const lkReady = lkMethod === "plate" ? Boolean(lkValue && lkResolvedState) : Boolean(lkValue);
  const lkCopyValue = () => {
    if (navigator.clipboard && lkValue) navigator.clipboard.writeText(lkValue);
    setLkCopied(true);
    setTimeout(() => setLkCopied(false), 1800);
  };
  // Copy the lookup value for convenience. The actual navigation is handled by a
  // real <a target="_blank"> element, NOT window.open() — programmatic
  // window.open is blocked by Cross-Origin-Opener-Policy when the app runs
  // inside a cross-origin iframe (observed in Safari).
  const lkOnOpenPortal = () => { lkCopyValue(); };
  const lkMethodLabel =
    lkMethod === "plate" ? "License plate" : lkMethod === "citation" ? "Citation number" : "VIN";
  const fapCopy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(foilAppealLetter);
    setFapCopied(true);
    setTimeout(() => setFapCopied(false), 1800);
  };
  const fapMailto = () => {
    const subject = encodeURIComponent(`FOIL Appeal under POL § 89(4)(a) — Ticket No. ${f.ticket || ""}`);
    const body = encodeURIComponent(foilAppealLetter);
    window.open(`mailto:${FOIL_APPEAL_CONTACT.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const foilCopy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(foilLetter);
    setFoilCopied(true);
    setTimeout(() => setFoilCopied(false), 1800);
  };
  const foilMailto = () => {
    const subject = encodeURIComponent(`FOIL Request — records concerning Ticket No. ${f.ticket || ""}`);
    const body = encodeURIComponent(foilLetter);
    window.open(`mailto:${FOIL_CONTACT.email}?subject=${subject}&body=${body}`, "_blank");
  };
  async function foilSubmit() {
    setFoilSubmitting(true);
    setFoilSubmitMsg(null);
    try {
      const res = await apiRequest("POST", "/api/submit-foil", {
        ticket: f.ticket,
        name: f.name,
        email: f.email,
        recipient: FOIL_CONTACT.email,
        format: foil.format,
        letter: foilLetter,
      });
      const json = await res.json();
      if (json.ok) {
        setFoilSubmitMsg({
          kind: "ok",
          text: json.delivered
            ? `Your FOIL request was submitted to the City Clerk (${FOIL_CONTACT.email}). Keep a copy — the City must respond within five business days.`
            : `Your request was logged. To finish submitting, use "Open email" below (it pre-fills everything to ${FOIL_CONTACT.email}) or the official FOIL portal. Keep a copy for your records.`,
        });
        if (!json.delivered) foilMailto();
      } else {
        setFoilSubmitMsg({ kind: "err", text: "Couldn't submit automatically. Use \"Open email\" below to send it yourself." });
      }
    } catch {
      setFoilSubmitMsg({ kind: "err", text: "Couldn't submit automatically. Use \"Open email\" below to send it yourself." });
    } finally {
      setFoilSubmitting(false);
    }
  }

  // Ask the AI to match a plain-English description to a situation card.
  async function aiMatchSituation() {
    if (aiDesc.trim().length < 10) {
      setAiMatchMsg({ kind: "err", text: "Add a little more detail — a sentence or two about what happened." });
      return;
    }
    setAiMatching(true);
    setAiMatchMsg(null);
    try {
      const res = await apiRequestRaw("POST", "/api/suggest-situation", { description: aiDesc });
      // Read the body even on 4xx/5xx — server validation errors carry a
      // user-facing message. Rate-limit (429) responses may be plain text.
      let json: any = null;
      try { json = await res.json(); } catch { json = null; }
      if (json?.ok && json.situation) {
        setSit(json.situation);
        // Carry the resident's own words into the "Add your own details" field
        // on the next step, so they don't have to type it twice.
        setF((p) => (p.facts.trim() ? p : { ...p, facts: aiDesc.trim() }));
        const matched = SITUATIONS.find((s) => s.id === json.situation);
        setAiMatchMsg({
          kind: "ok",
          text: `Matched: “${matched?.title || json.situation}”. ${json.reason || ""} If that's not right, just pick a different one above.`,
        });
      } else {
        setAiMatchMsg({ kind: "err", text: json?.message || json?.error || "Couldn't match it automatically — pick the closest situation above." });
      }
    } catch {
      setAiMatchMsg({ kind: "err", text: "Couldn't match it automatically — pick the closest situation above." });
    } finally {
      setAiMatching(false);
    }
  }

  // Ask the AI to copy-edit the appeal letter (facts and citations preserved).
  async function polishLetter() {
    setPolishing(true);
    setPolishMsg(null);
    try {
      const res = await apiRequestRaw("POST", "/api/polish-letter", { letter });
      // Read the body even on 4xx/5xx — server validation errors carry a
      // user-facing message. Rate-limit (429) responses may be plain text.
      let json: any = null;
      try { json = await res.json(); } catch { json = null; }
      if (json?.ok && json.letter) {
        setPolished(json.letter);
        setPolishMsg({ kind: "ok", text: "Polished for clarity and tone. Read it through before sending — your facts and citations are unchanged, and you can switch back anytime." });
      } else {
        setPolishMsg({ kind: "err", text: json?.message || json?.error || "Couldn't polish right now — your original letter is ready to send as-is." });
      }
    } catch {
      setPolishMsg({ kind: "err", text: "Couldn't polish right now — your original letter is ready to send as-is." });
    } finally {
      setPolishing(false);
    }
  }

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  // Reads a screenshot, photo, OR PDF of a paper ticket / portal citation-detail
  // page through the OCR pipeline and auto-fills the full scan field set. The
  // user relays nothing; anything the model can't read stays empty ("not shown").
  async function handleFile(file: File) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (file.size > 8 * 1024 * 1024) {
      setUploadMsg({ kind: "err", text: "File is too large (max 8MB). Try a smaller photo or screenshot." });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    setParseMsg(null);
    try {
      let dataUrl: string;
      if (isPdf) {
        const { pdfFirstPageToImage } = await import("@/lib/pdf");
        dataUrl = await pdfFirstPageToImage(file);
      } else {
        dataUrl = await readAsDataUrl(file);
      }
      setPreview(dataUrl);
      const res = await apiRequestRaw("POST", "/api/extract-ticket", { image: dataUrl });
      let json: any = null;
      try { json = await res.json(); } catch { json = null; }
      if (json?.unavailable) {
        setUploadMsg({ kind: "err", text: json.message || "Photo reading isn't set up on this server. Enter the details by hand." });
        return;
      }
      const x = (json && json.fields) || {};
      setF((p) => ({
        ...p,
        ticket: x.ticket || p.ticket,
        vdate: x.vdate || p.vdate,
        vtime: x.vtime || p.vtime,
        location: x.location || p.location,
        plate: x.plate || p.plate,
        state: x.state || p.state,
        make: x.make || p.make,
        model: x.model || p.model,
        violation: x.violation || p.violation,
        amount: x.amount || p.amount,
        isCamera: typeof x.is_camera === "boolean" ? x.is_camera : p.isCamera,
      }));
      // Scan-only fields (no slot in the form) → scanValues, so one capture
      // auto-fills the whole dismissal scan. Only keep non-empty values.
      setScanValues((p) => {
        const next = { ...p };
        const put = (k: string, v: any) => { if (typeof v === "string" && v.trim()) next[k] = v.trim(); };
        put("plateType", x.plate_type);
        put("regExpiration", x.reg_expiration);
        put("bodyType", x.body_type);
        put("meterNumber", x.meter_number);
        put("officerId", x.officer_id);
        put("daysHours", x.days_hours);
        return next;
      });
      setCaptured(true);
      const got = [x.ticket && "ticket number", x.vdate && "date", x.plate && "plate", x.make && "make", x.body_type && "body type"].filter(Boolean);
      setUploadMsg({
        kind: "ok",
        text: got.length
          ? `Read your ${got.join(", ")}. We'll check each field in the scan — fix anything that's off.`
          : "Upload received, but some fields were hard to read. The scan will mark those “not shown.”",
      });
    } catch {
      setUploadMsg({ kind: "err", text: isPdf ? "Couldn't read that PDF. Try a screenshot of the page instead." : "Couldn't read the image automatically. You can still type the details in below." });
    } finally {
      setUploading(false);
    }
  }

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(displayLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const mailto = () => {
    const subject = encodeURIComponent(`Parking Ticket Appeal — Ticket No. ${f.ticket || ""}`);
    const body = encodeURIComponent(displayLetter);
    window.open(`mailto:parkingticketappeal@albanyny.gov?subject=${subject}&body=${body}`, "_blank");
  };

  const reset = () => { setStep(0); setSit(null); setF(emptyForm); setPreview(null); setUploadMsg(null); setFoilMode(false); setFoil(emptyFoil); setFoilSubmitMsg(null); setAppealMode(false); setFap(emptyFoilAppeal); setLookupMode(false); setLkMethod("plate"); setLkPlate(""); setLkState("NY"); setLkCitation(""); setLkVin(""); setAiDesc(""); setAiMatchMsg(null); setPolished(null); setPolishMsg(null); setTriedContinue(false); setLetterMode("situation"); setScanResult(null); setScanSourced(false); setScanValues({}); setPasteText(""); setParseMsg(null); setCaptured(false); clearState(); setHasSaved(false); };

  const inputCls = "w-full rounded-md border border-input bg-secondary/40 px-3 py-2.5 text-sm focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 transition";
  const labelCls = "block text-sm font-semibold mb-1.5";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="text-primary"><Shield size={24} /></span>
            <div>
              <div className="font-semibold leading-none tracking-tight" style={{ fontFamily: "var(--font-sans)" }}>Albany Ticket Appeal</div>
              <div className="text-xs text-muted-foreground mt-0.5">Contest your parking ticket — free</div>
            </div>
          </div>
          <button onClick={toggleDark} aria-label="Toggle theme"
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground hover-elevate">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Hero (step 0 only) */}
      {step === 0 && (
        <section className="mx-auto max-w-4xl px-5 pt-12 pb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            <Shield size={13} /> For City of Albany residents
          </span>
          <h1 className="mt-4 mb-3 max-w-[19ch] text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Beat your Albany parking ticket — fast and effectively.
          </h1>
          <p className="max-w-[56ch] text-muted-foreground">
            Snap a photo of your ticket or type it in. We match your situation to the strongest defense
            Albany's Parking Violations Bureau actually accepts, then generate a ready-to-send appeal — no lawyer required.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {["Reads your ticket from a photo", "Tracks your appeal deadline", "Free & private"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Check size={16} className="text-accent" /> {t}
              </div>
            ))}
          </div>
          <div className="mt-7">
            <button onClick={focusTicket} data-testid="button-hero-start"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover-elevate">
              Start your appeal <ArrowRight size={16} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-muted-foreground">Not sure what you owe?</span>
            <button onClick={openLookup} data-testid="button-open-lookup-hero"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline">
              <Search size={15} /> Check your open parking tickets
            </button>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-4xl px-5 pb-20">
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm sm:p-8">
          {/* ============ CHECK MY OPEN TICKETS MODE ============ */}
          {lookupMode ? (
            <div data-testid="panel-lookup">
              <button onClick={closeLookup} data-testid="button-lookup-back"
                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Back
              </button>
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Search size={20} /></span>
                <h2 className="text-xl font-semibold">Check my open parking tickets</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                The City of Albany lets you see every open parking citation tied to your vehicle on its official
                <a className="text-primary underline decoration-dotted" href={LOOKUP_PORTAL.parkingUrl} target="_blank" rel="noopener"> Ticketing &amp; Enforcement portal</a>.
                Pick how you want to look it up — we'll copy the value so you just paste it on the portal, no retyping.
              </p>

              {/* Lookup method selector — mirrors the portal's own search options */}
              <div className="mb-5">
                <label className={labelCls}>How do you want to look it up?</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { id: "plate", label: "License plate", sub: "Plate + state" },
                    { id: "citation", label: "Citation number", sub: "From your ticket" },
                    { id: "vin", label: "VIN", sub: "Vehicle ID number" },
                  ] as const).map((o) => {
                    const on = lkMethod === o.id;
                    return (
                      <button key={o.id} onClick={() => { setLkMethod(o.id); setLkCopied(false); }} data-testid={`lookup-method-${o.id}`}
                        className={`rounded-lg border p-3 text-left transition hover-elevate ${on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                        <div className="text-sm font-semibold">{o.label}</div>
                        <div className="text-xs text-muted-foreground">{o.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {lkMethod === "plate" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls} htmlFor="lk-plate">License plate</label>
                    <input id="lk-plate" className={inputCls} value={lkPlate}
                      onChange={(e) => setLkPlate(e.target.value)}
                      placeholder="e.g. ABC1234" autoCapitalize="characters" data-testid="input-lookup-plate" />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="lk-state">State / province</label>
                    <select id="lk-state" className={inputCls} value={lkState}
                      onChange={(e) => setLkState(e.target.value)} data-testid="select-lookup-state">
                      {LOOKUP_STATES.map((s) => (
                        <option key={s.id} value={s.abbr}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {lkMethod === "citation" && (
                <div>
                  <label className={labelCls} htmlFor="lk-citation">Citation / ticket number</label>
                  <input id="lk-citation" className={inputCls} value={lkCitation}
                    onChange={(e) => setLkCitation(e.target.value)}
                    placeholder="e.g. 1234567" data-testid="input-lookup-citation" />
                </div>
              )}

              {lkMethod === "vin" && (
                <div>
                  <label className={labelCls} htmlFor="lk-vin">VIN (Vehicle Identification Number)</label>
                  <input id="lk-vin" className={inputCls} value={lkVin}
                    onChange={(e) => setLkVin(e.target.value)}
                    placeholder="17 characters, e.g. 1HGCM82633A004352" autoCapitalize="characters" data-testid="input-lookup-vin" />
                </div>
              )}

              {/* Ready-to-paste card — the exact value(s) to enter on the portal.
                  The lookup value is copied to the clipboard; for a plate lookup
                  the state must be picked from the portal's dropdown (you can't
                  paste into a <select>), so we show its exact name. */}
              <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-4" data-testid="card-lookup-paste">
                <div className="mb-3 text-sm font-semibold">Enter {lkMethod === "plate" ? "these" : "this"} on the portal</div>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[12rem]">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lkMethodLabel} — paste this</div>
                    <div className="flex items-center gap-2">
                      <code className="rounded-md border border-border bg-background px-3 py-2 font-mono text-lg font-bold tracking-widest" data-testid="text-lookup-value-big">
                        {lkValue || "—"}
                      </code>
                      <button onClick={lkCopyValue} disabled={!lkValue} data-testid="button-lookup-copy"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover-elevate disabled:opacity-40 disabled:cursor-not-allowed">
                        {lkCopied ? <><Check size={14} className="text-accent" /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                  </div>
                  {lkMethod === "plate" && (
                    <div className="min-w-[10rem]">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">State — select this</div>
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold" data-testid="text-lookup-state-big">
                        {lkResolvedState ? lkResolvedState.name : "—"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* What you'll do on the portal — steps adapt to the chosen method */}
              <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="mb-2 text-sm font-semibold">What happens next</div>
                <ol className="space-y-1.5 text-sm text-muted-foreground">
                  <li>1. Press <b>Open the City portal</b> — it opens in a new tab and your {lkMethodLabel.toLowerCase()} is copied automatically.</li>
                  {lkMethod === "plate" && (
                    <li>2. In the box labeled <b>“To see all open citations for your vehicle…”</b>, paste your plate (⌘/Ctrl+V) and pick <b className="text-foreground">{lkResolvedState ? lkResolvedState.name : "your state"}</b> from the dropdown.</li>
                  )}
                  {lkMethod === "citation" && (
                    <li>2. In the box labeled <b>“If you know your citation number, enter it here:”</b>, paste your citation number (⌘/Ctrl+V).</li>
                  )}
                  {lkMethod === "vin" && (
                    <li>2. In the box labeled <b>“To see all open citations for your vehicle, enter your VIN number here:”</b>, paste your VIN (⌘/Ctrl+V).</li>
                  )}
                  <li>3. Complete the quick “Human Verification” check, then press <b>Search</b>.</li>
                  <li>4. {lkMethod === "citation" ? "Your citation, its status, and the amount due will appear." : "Every open citation, its status, and the amount due will appear."}</li>
                </ol>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {lkReady ? (
                  <a href={LOOKUP_PORTAL.parkingUrl} target="_blank" rel="noopener noreferrer"
                    onClick={lkOnOpenPortal} data-testid="button-lookup-open"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
                    <ExternalLink size={16} /> Open the City portal &amp; copy my {lkMethodLabel.toLowerCase()}
                  </a>
                ) : (
                  <button disabled data-testid="button-lookup-open-disabled"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground opacity-40 cursor-not-allowed">
                    <ExternalLink size={16} /> {lkMethod === "plate" ? "Enter your plate & state first" : `Enter your ${lkMethodLabel.toLowerCase()} first`}
                  </button>
                )}
              </div>

              {/* Why we hand off rather than show results inline */}
              <div className="mt-6 flex items-start gap-3 rounded-lg bg-primary/5 px-4 py-3 text-xs text-muted-foreground" data-testid="note-lookup-why">
                <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  We send you to the City's own system so you see live, official records straight from the source —
                  no middle-man copy of your data. The portal uses a human-verification step, so the lookup happens there, not here.
                </div>
              </div>

              {/* Camera tickets are handled elsewhere */}
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                <Camera size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  Looking for a <b>red-light or school-zone speed camera</b> ticket? Those are handled separately through the
                  Citation Processing Center, not the parking portal — check them on the
                  <a className="text-primary underline decoration-dotted" href={LOOKUP_PORTAL.cameraUrl} target="_blank" rel="noopener"> City's Pay Bills &amp; Tickets page</a>.
                </div>
              </div>
            </div>
          ) : appealMode ? (
            <div data-testid="panel-foil-appeal">
              <button onClick={closeAppeal} data-testid="button-appeal-back"
                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Back to my FOIL request
              </button>
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Gavel size={20} /></span>
                <h2 className="text-xl font-semibold">Appeal a FOIL denial</h2>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                If the City denied your records request, ignored it past five business days, redacted too much, or
                overcharged you, the law gives you 30 days to appeal in writing. We draft the appeal letter, cite the
                statute, and copy the state oversight body that must review it.
              </p>

              {/* What went wrong */}
              <h3 className="mb-2 text-sm font-semibold">What happened with your request?</h3>
              <div className="space-y-2.5">
                {FOIL_APPEAL_REASONS.map((r) => {
                  const on = fap.reason === r.id;
                  return (
                    <button key={r.id} onClick={() => setFap((p) => ({ ...p, reason: r.id as FoilAppealReason }))} data-testid={`appeal-reason-${r.id}`}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition hover-elevate ${on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                        {on && <Check size={13} />}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{r.label}</div>
                        <div className="text-xs leading-snug text-muted-foreground">{r.detail}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dates */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>When did you send your FOIL request?</label>
                  <input type="date" className={inputCls} value={fap.requestDate}
                    onChange={(e) => setFap((p) => ({ ...p, requestDate: e.target.value }))} data-testid="input-appeal-reqdate" />
                </div>
                <div>
                  <label className={labelCls}>Date of the denial <span className="font-normal text-muted-foreground/70">(if any)</span></label>
                  <input type="date" className={inputCls} value={fap.denialDate}
                    onChange={(e) => setFap((p) => ({ ...p, denialDate: e.target.value }))} data-testid="input-appeal-dendate" />
                </div>
              </div>

              {/* Records at issue */}
              <div className="mt-5">
                <label className={labelCls}>Which records are you fighting for? <span className="font-normal text-muted-foreground/70">(in your own words)</span></label>
                <textarea className={`${inputCls} min-h-16 resize-y`} value={fap.records}
                  onChange={(e) => setFap((p) => ({ ...p, records: e.target.value }))} data-testid="input-appeal-records"
                  placeholder="e.g. the ticket photos and the meter maintenance log" />
              </div>

              {/* What the City said */}
              <div className="mt-5">
                <label className={labelCls}>What reason did the City give? <span className="font-normal text-muted-foreground/70">(optional — paste or paraphrase)</span></label>
                <textarea className={`${inputCls} min-h-16 resize-y`} value={fap.agencyReason}
                  onChange={(e) => setFap((p) => ({ ...p, agencyReason: e.target.value }))} data-testid="input-appeal-agencyreason"
                  placeholder="e.g. 'These records are exempt' or 'We have no responsive records.'" />
              </div>

              {/* Live preview */}
              <h3 className="mt-7 mb-2 text-sm font-semibold">Your appeal letter</h3>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-border bg-secondary/30 p-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap" data-testid="text-appeal-letter">{foilAppealLetter}</div>

              {/* Legal basis */}
              <div className="mt-5 rounded-md border border-border bg-background/60 px-4 py-3 text-xs" data-testid="section-appeal-legal-basis">
                <b className="flex items-center gap-1.5 text-foreground"><Scale size={14} className="shrink-0" /> The law behind your appeal</b>
                <ul className="mt-2 space-y-2">
                  {FOIL_APPEAL_AUTHORITY.map((c, i) => (
                    <li key={i} data-testid={`appeal-citation-${i}`}>
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline">
                        {c.authority}<ExternalLink size={11} className="shrink-0" />
                      </a>
                      <span className="block text-muted-foreground">{c.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit actions */}
              <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5">
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Send size={18} /> Send your appeal</h4>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Send to the City Clerk's office, attention <b>{FOIL_APPEAL_CONTACT.appealsOfficer}</b> ({FOIL_APPEAL_CONTACT.email}). The City must respond within ten business days.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={fapMailto} data-testid="button-appeal-email"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate"><Mail size={16} /> Open in your email app</button>
                  <button onClick={() => printLetter(foilAppealLetter, `FOIL Appeal — Ticket ${f.ticket || ""}`)} data-testid="button-appeal-print"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Printer size={16} /> Save as PDF / print</button>
                  <button onClick={fapCopy} data-testid="button-appeal-copy"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Copy size={16} /> {fapCopied ? "Copied!" : "Copy letter"}</button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {FOIL_APPEAL_CONTACT.coog.note} Mail copies to: {FOIL_APPEAL_CONTACT.agencyLines.join(", ")}.
                </p>
              </div>
            </div>
          ) : foilMode ? (
            <div data-testid="panel-foil">
              <button onClick={closeFoil} data-testid="button-foil-back"
                className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Back to my appeal
              </button>
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><FileSearch size={20} /></span>
                <h2 className="text-xl font-semibold">Request the City's records (FOIL)</h2>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                New York's Freedom of Information Law lets you demand the City's own evidence — the photos, logs, and
                maintenance records behind your ticket. Pick what you want in plain English; we turn it into a
                legally-proper FOIL letter and submit it for you.
              </p>

              {/* Intake: record checkboxes */}
              <h3 className="mb-2 text-sm font-semibold">What records do you want?</h3>
              <p className="mb-3 text-xs text-muted-foreground">We pre-selected the ones that fit your situation. Add or remove any.</p>
              <div className="space-y-2.5">
                {FOIL_RECORDS.map((r) => {
                  const on = foil.records.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => toggleFoilRecord(r.id)} data-testid={`foil-record-${r.id}`}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition hover-elevate ${on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                        {on && <Check size={14} />}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{r.label}</div>
                        <div className="text-xs leading-snug text-muted-foreground">{r.detail}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom free-text */}
              <div className="mt-5">
                <label className={labelCls}>Anything else, in your own words <span className="font-normal text-muted-foreground/70">(optional)</span></label>
                <textarea className={`${inputCls} min-h-20 resize-y`} value={foil.custom}
                  onChange={(e) => setFoil((p) => ({ ...p, custom: e.target.value }))} data-testid="input-foil-custom"
                  placeholder="e.g. Any complaints filed about this meter, or the work order for the faded sign on my block." />
              </div>

              {/* Delivery format */}
              <div className="mt-5">
                <label className={labelCls}>How would you like to receive the records?</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    { id: "email", label: "By email", sub: "Fastest, usually free" },
                    { id: "mail", label: "By mail", sub: "$0.25 per page" },
                    { id: "inspect", label: "Inspect in person", sub: "Free, at City Hall" },
                  ] as const).map((o) => {
                    const on = foil.format === o.id;
                    return (
                      <button key={o.id} onClick={() => setFoil((p) => ({ ...p, format: o.id }))} data-testid={`foil-format-${o.id}`}
                        className={`rounded-lg border p-3 text-left transition hover-elevate ${on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                        <div className="text-sm font-semibold">{o.label}</div>
                        <div className="text-xs text-muted-foreground">{o.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Your contact (reuses ticket form) */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Your name</label><input className={inputCls} value={f.name} onChange={setField("name")} placeholder="Jane Doe" data-testid="input-foil-name" /></div>
                <div><label className={labelCls}>Your email</label><input className={inputCls} value={f.email} onChange={setField("email")} placeholder="you@email.com" data-testid="input-foil-email" /></div>
              </div>

              {/* Live letter preview */}
              <h3 className="mt-7 mb-2 text-sm font-semibold">Your FOIL letter</h3>
              <p className="mb-3 text-xs text-muted-foreground">This updates as you choose records. You can edit anything after copying or opening it in email.</p>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-border bg-secondary/30 p-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap" data-testid="text-foil-letter">{foilLetter}</div>

              {/* Legal basis */}
              <div className="mt-5 rounded-md border border-border bg-background/60 px-4 py-3 text-xs" data-testid="section-foil-legal-basis">
                <b className="flex items-center gap-1.5 text-foreground"><Scale size={14} className="shrink-0" /> Your legal right to these records</b>
                <p className="mt-1 text-muted-foreground">These citations are written into your letter. The City must follow them.</p>
                <ul className="mt-2 space-y-2">
                  {FOIL_AUTHORITY.map((c, i) => (
                    <li key={i} data-testid={`foil-citation-${i}`}>
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline">
                        {c.authority}<ExternalLink size={11} className="shrink-0" />
                      </a>
                      <span className="block text-muted-foreground">{c.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit */}
              {foilSubmitMsg && (
                <div className={`mt-5 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${foilSubmitMsg.kind === "ok" ? "bg-accent/12 text-accent" : "bg-destructive/12 text-destructive"}`} data-testid="text-foil-submit-msg">
                  {foilSubmitMsg.kind === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <X size={18} className="mt-0.5 shrink-0" />}
                  <div>{foilSubmitMsg.text}</div>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5">
                <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Send size={18} /> Submit your FOIL request</h4>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  Sends to the City Clerk — Records Access Officer at <b>{FOIL_CONTACT.email}</b>. The City must respond within five business days.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={foilSubmit} disabled={foilSubmitting} data-testid="button-foil-submit"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate disabled:opacity-50">
                    {foilSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit request
                  </button>
                  <button onClick={foilMailto} data-testid="button-foil-email"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Mail size={16} /> Open in your email app</button>
                  <button onClick={() => printLetter(foilLetter, `FOIL Request — Ticket ${f.ticket || ""}`)} data-testid="button-foil-print"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Printer size={16} /> Save as PDF / print</button>
                  <button onClick={foilCopy} data-testid="button-foil-copy"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Copy size={16} /> {foilCopied ? "Copied!" : "Copy letter"}</button>
                  <a href={FOIL_CONTACT.portalInfo} target="_blank" rel="noopener noreferrer" data-testid="link-foil-portal"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><ExternalLink size={16} /> Official FOIL portal</a>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground"><Paperclip size={13} className="mt-0.5 shrink-0" /> "Open in your email app" pre-fills the request, but can't attach files — add any enclosures yourself before sending.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Prefer the City's online portal? Use “Official FOIL portal” — you can paste the copied letter there. Mail/in-person: {FOIL_CONTACT.addressLines.join(", ")}. Phone {FOIL_CONTACT.phone}.
                </p>
              </div>

              {/* Denial-appeal entry */}
              <button onClick={openAppeal} data-testid="button-open-appeal"
                className="mt-4 flex w-full items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover-elevate">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Gavel size={20} /></span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Already got a denial — or no response?</div>
                  <div className="text-xs leading-snug text-muted-foreground">Build a FOIL appeal under Public Officers Law § 89(4)(a). You have 30 days from a denial.</div>
                </div>
                <span className="shrink-0 text-muted-foreground"><ArrowLeft size={16} className="rotate-180" /></span>
              </button>
            </div>
          ) : (
          <>
          {/* Resume notice + clear control (only when browser storage works) */}
          {canPersist && hasSaved && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-xs" data-testid="banner-resume">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Info size={14} className="shrink-0 text-primary" />
                Your progress is saved in this browser so you can finish later.
              </span>
              <button onClick={reset} data-testid="button-clear-progress"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-semibold hover-elevate">
                <RotateCcw size={13} /> Start over
              </button>
            </div>
          )}

          {/* Stepper */}
          <div className="mb-8 flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition ${i <= step ? "bg-primary" : "bg-border"}`} />
                <small className={`mt-2 block text-xs font-semibold uppercase tracking-wide ${i === step ? "text-foreground" : "text-muted-foreground/60"}`}>{s}</small>
              </div>
            ))}
          </div>

          {/* STEP 0 — ticket + upload */}
          {step === 0 && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">Your ticket details</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Upload a photo of the ticket and we'll read it for you — or enter the details by hand. Find them on the
                ticket or at <a className="text-primary underline decoration-dotted" href="https://albany.rmcpay.com/" target="_blank" rel="noopener">albany.rmcpay.com</a>.
              </p>

              <button onClick={openLookup} data-testid="button-open-lookup-step0"
                className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                <Search size={15} /> Don't know your ticket number? Look up your open tickets
              </button>

              {/* Upload zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }}
                className="mb-6 cursor-pointer rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center transition hover:border-primary hover:bg-secondary/50"
              >
                <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
                {uploading ? (
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Loader2 size={20} className="animate-spin" /> Reading your ticket…
                  </div>
                ) : preview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={preview} alt="Ticket preview" className="max-h-40 rounded-md border border-border object-contain" />
                    <span className="text-xs text-muted-foreground">Tap to replace photo</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Upload size={22} /></span>
                    <span className="text-sm font-semibold">Upload or photograph your ticket</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG, or PDF, up to 8MB · we'll auto-fill the fields</span>
                  </div>
                )}
              </div>
              {uploadMsg && (
                <div className={`mb-6 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${uploadMsg.kind === "ok" ? "bg-accent/12 text-accent" : "bg-destructive/12 text-destructive"}`}>
                  {uploadMsg.kind === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <X size={18} className="mt-0.5 shrink-0" />}
                  <div>{uploadMsg.text}</div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Ticket / citation number *</label>
                  <input ref={ticketRef} className={inputCls} value={f.ticket} onChange={setField("ticket")} placeholder="e.g. 1234567" data-testid="input-ticket" />
                  {triedContinue && !f.ticket && (
                    <p className="mt-1.5 text-xs font-medium text-destructive" data-testid="error-ticket">Enter your ticket number.</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Date of violation *</label>
                  <input type="date" className={inputCls} value={f.vdate} onChange={setField("vdate")} data-testid="input-vdate" />
                  {triedContinue && !f.vdate && (
                    <p className="mt-1.5 text-xs font-medium text-destructive" data-testid="error-vdate">Enter the date of violation.</p>
                  )}
                </div>
              </div>
              <div className="mt-4"><label className={labelCls}>Location <span className="font-normal text-muted-foreground/70">(optional)</span></label><input className={inputCls} value={f.location} onChange={setField("location")} placeholder="e.g. 100 State St, near Eagle St" data-testid="input-location" /></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>License plate <span className="font-normal text-muted-foreground/70">(optional)</span></label><input className={inputCls} value={f.plate} onChange={setField("plate")} placeholder="ABC-1234" data-testid="input-plate" /></div>
                <div><label className={labelCls}>State</label><input className={inputCls} value={f.state} onChange={setField("state")} placeholder="NY" data-testid="input-state" /></div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={f.isCamera} onChange={(e) => setF((p) => ({ ...p, isCamera: e.target.checked }))} className="h-4 w-4 accent-[hsl(var(--primary))]" data-testid="checkbox-camera" />
                This is a red-light or school-zone camera ticket (RLC / SZS)
              </label>

              {deadline && (
                <div className={`mt-5 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${daysLeft != null && daysLeft <= 5 ? "bg-[hsl(33_70%_40%/0.12)] text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]" : "bg-primary/10 text-primary"}`}>
                  <Clock size={18} className="mt-0.5 shrink-0" />
                  <div data-testid="text-deadline">
                    {daysLeft != null && daysLeft < 0 ? (
                      <><b>Heads up — the standard appeal window has passed.</b> Albany must receive {f.isCamera ? "red-light/school-zone" : "parking"} appeals within {days} days of issuance (by {fmtDate(deadline.toISOString().slice(0, 10))}). It's still worth contacting the Bureau, but late appeals may not be accepted.</>
                    ) : (
                      <><b>You have about {daysLeft} day{daysLeft === 1 ? "" : "s"} left.</b> Albany must receive your {f.isCamera ? "red-light/school-zone" : "parking"} appeal within {days} days — by <b>{fmtDate(deadline.toISOString().slice(0, 10))}</b>. Don't pay it first; paying counts as pleading guilty.</>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <span />
                <button onClick={tryContinueStep1} aria-disabled={!canStep1} data-testid="button-continue-1"
                  className={`inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate ${!canStep1 ? "opacity-40" : ""}`}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 — situation */}
          {step === STEP.SITUATION && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">What best describes your situation?</h2>
              <p className="mb-5 text-sm text-muted-foreground">Optional — pick what fits, or go straight to the error scan, which is the strongest way to get a ticket dismissed.</p>

              {/* Primary path: the dismissal-first error scan */}
              <button onClick={() => { setStep(STEP.SCAN); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-go-scan"
                className="mb-5 flex w-full items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 p-4 text-left transition hover-elevate">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><ScanLine size={22} /></span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Scan my ticket for a dismissal <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent">Recommended</span></div>
                  <div className="text-xs leading-snug text-muted-foreground">We check the ticket's required fields for a defect that forces a mandatory dismissal under NY law — strongest first.</div>
                </div>
                <span className="shrink-0 text-primary"><ArrowRight size={18} /></span>
              </button>

              <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Or tell us what happened (fallback)</div>
              <div className="space-y-3">
                {SITUATIONS.map((s) => {
                  const Ic = ICONS[s.icon];
                  const selected = sit === s.id;
                  return (
                    <button key={s.id} onClick={() => setSit(s.id)} data-testid={`option-${s.id}`}
                      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition hover-elevate ${selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-primary"}`}>
                        <Ic size={20} />
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold">{s.title}</h4>
                        <p className="text-xs leading-snug text-muted-foreground">{s.sub}</p>
                      </div>
                      {selected && <Check size={18} className="shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>

              {/* AI matcher — describe it in your own words */}
              <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/30 p-4" data-testid="panel-ai-match">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={16} className="text-primary" /> Not sure which one? Describe it — we'll match it
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Tell us what happened in your own words and AI will pick the situation that fits.
                  It only chooses from the options above — you can always change it.
                </p>
                <textarea className={`${inputCls} min-h-16 resize-y`} value={aiDesc}
                  onChange={(e) => setAiDesc(e.target.value)} data-testid="input-ai-describe"
                  placeholder="e.g. I paid in the Park Albany app but typed one letter of my plate wrong, and got a ticket anyway." />
                <button onClick={aiMatchSituation} disabled={aiMatching || aiDesc.trim().length < 10} data-testid="button-ai-match"
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover-elevate disabled:opacity-40 disabled:cursor-not-allowed">
                  {aiMatching ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Match my situation
                </button>
                {aiMatchMsg && (
                  <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs ${aiMatchMsg.kind === "ok" ? "bg-accent/12 text-accent" : "bg-destructive/12 text-destructive"}`} data-testid="text-ai-match-msg">
                    {aiMatchMsg.kind === "ok" ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <Info size={15} className="mt-0.5 shrink-0" />}
                    <div>{aiMatchMsg.text}</div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(STEP.TICKET)} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
                <button onClick={() => { setStep(STEP.SCAN); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-continue-2"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">Next: scan my ticket →</button>
              </div>
            </div>
          )}

          {/* STEP 2 — Ticket Error Scan (dismissal-first defense discovery) */}
          {step === STEP.SCAN && (
            <div data-testid="step-scan">
              {f.isCamera ? (
                <div data-testid="scan-camera-skip">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Camera size={20} /></span>
                    <h2 className="text-xl font-semibold">Camera tickets skip the scan</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is a red-light or school-zone speed camera ticket. Those run under a different law (VTL § 1111-a / § 1180-f) and the parking-ticket field scan does not apply.
                    Review the video and appeal at <a className="text-primary underline decoration-dotted" href="https://www.viewcitation.com" target="_blank" rel="noopener noreferrer">viewcitation.com</a> or by phone at 1-855-427-0455.
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <button onClick={() => setStep(STEP.SITUATION)} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
                    <button onClick={() => onScanProceed("situation")} data-testid="scan-camera-continue"
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">Continue to a written statement →</button>
                  </div>
                </div>
              ) : !scanSourced ? (
                <div data-testid="scan-source">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><FileSearch size={20} /></span>
                    <h2 className="text-xl font-semibold">Get your ticket details</h2>
                  </div>
                  <p className="mb-5 text-sm text-muted-foreground">
                    The fastest way: pull your real case record from the City portal and let us read every field. One screenshot — you don't type anything. We only use what's actually shown; we never guess a field.
                  </p>

                  <input ref={sourceFileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />

                  {/* PRIMARY: one-tap portal capture */}
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4" data-testid="scan-source-portal">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      One-tap portal capture <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent">Recommended</span>
                    </div>
                    <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>1. Open your case on the City's official portal and log in{(f.plate || f.ticket) ? <> (search with <b className="text-foreground">{f.ticket ? `ticket ${f.ticket}` : `plate ${f.plate}`}</b>)</> : null}. You clear the human-verification check — we never touch it.</li>
                      <li>2. Take ONE screenshot of the citation-detail page (or save it as PDF).</li>
                      <li>3. Upload it here — we read every field automatically.</li>
                    </ol>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a href={LOOKUP_PORTAL.parkingUrl} target="_blank" rel="noopener noreferrer" data-testid="scan-source-portal-link"
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover-elevate">
                        <ExternalLink size={15} /> Open the City portal
                      </a>
                      <button onClick={() => sourceFileRef.current?.click()} disabled={uploading} data-testid="scan-source-screenshot"
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover-elevate disabled:opacity-50">
                        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload screenshot / PDF
                      </button>
                    </div>
                  </div>

                  {/* SECONDARY: paper ticket photo */}
                  <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="text-sm font-semibold">Or: I have the paper ticket</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(preview || f.ticket || f.plate)
                        ? "We already have details from your photo / what you typed — you can scan now."
                        : "Snap or upload a photo of the paper citation and we'll read every field."}
                    </p>
                    <div className="mt-3">
                      <button onClick={() => sourceFileRef.current?.click()} disabled={uploading} data-testid="scan-source-upload"
                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover-elevate disabled:opacity-50">
                        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload a photo
                      </button>
                    </div>
                  </div>

                  {/* FALLBACK: paste text */}
                  <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="text-sm font-semibold">Or: paste the citation details as text</div>
                    <p className="mt-1 text-xs text-muted-foreground">If you can't upload an image, paste the text from the portal page and we'll parse it.</p>
                    <textarea className={`${inputCls} mt-2 min-h-24 resize-y`} value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)} data-testid="scan-source-paste"
                      placeholder={"Paste the citation-detail text here, e.g.\nPlate: ABC1234\nState: NY\nMake: Honda\nViolation: Expired meter\nDate: 06/01/2026"} />
                    <button onClick={parsePastedCitation} disabled={pasteText.trim().length < 4} data-testid="scan-source-parse"
                      className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover-elevate disabled:opacity-40 disabled:cursor-not-allowed">
                      <FileSearch size={15} /> Read these details
                    </button>
                  </div>

                  {(uploadMsg || parseMsg) && (
                    <div className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${(parseMsg || uploadMsg)!.kind === "ok" ? "bg-accent/12 text-accent" : "bg-destructive/12 text-destructive"}`} data-testid="scan-source-msg">
                      {(parseMsg || uploadMsg)!.kind === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
                      <div>{(parseMsg || uploadMsg)!.text}</div>
                    </div>
                  )}

                  {/* Capture coverage — what the screenshot included / missed */}
                  {captured && (
                    <div className="mt-4 rounded-xl border border-border bg-background/60 p-4" data-testid="scan-coverage">
                      <div className="mb-2 text-sm font-semibold">What we read from your capture</div>
                      {coverage.present.length > 0 && (
                        <p className="flex items-start gap-2 text-xs text-accent" data-testid="coverage-present">
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                          <span>Captured: {coverage.present.map((c) => c.label).join(", ")}.</span>
                        </p>
                      )}

                      {coverage.missingCore.length > 0 ? (
                        <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2.5 text-xs text-destructive" data-testid="coverage-missing-core">
                          <p className="flex items-start gap-2 font-semibold"><TriangleAlert size={14} className="mt-0.5 shrink-0" /> Your screenshot left out: {coverage.missingCore.map((c) => c.label).join(", ")}.</p>
                          <p className="mt-1.5 text-destructive/90">
                            How to retake: capture the <b>entire</b> citation-detail page in one shot. Expand every section first, scroll so the vehicle details and the violation/officer rows are visible, then screenshot again — or save the page as a PDF and upload that. On a phone, use a “full page” / scrolling screenshot.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 flex items-start gap-2 text-xs text-accent" data-testid="coverage-core-ok">
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> Looks complete — every core field came through.
                        </p>
                      )}

                      {coverage.missingOther.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground" data-testid="coverage-missing-other">
                          Also not detected (these may be lower on the page or may not apply to your charge): {coverage.missingOther.map((c) => c.label).join(", ")}. The scan marks these “not shown” so you can confirm them or make the City produce them — we never guess.
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button onClick={() => sourceFileRef.current?.click()} disabled={uploading} data-testid="coverage-retake"
                          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover-elevate disabled:opacity-50">
                          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Retake / upload again
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <button onClick={() => setStep(STEP.SITUATION)} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
                    <button onClick={() => { setScanSourced(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="scan-source-continue"
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
                      {captured && coverage.missingCore.length > 0 ? "Continue anyway" : "Continue to the scan"} <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">No ticket and the deadline is close? Continue anyway — the scan will help you file on time and make the City produce the record.</p>
                </div>
              ) : (
                <TicketScan
                  form={f}
                  scanValues={scanValues}
                  daysLeft={daysLeft}
                  deadlineDays={days}
                  onResult={setScanResult}
                  onProceed={onScanProceed}
                  onProvideValue={onProvideScanValue}
                />
              )}
            </div>
          )}

          {/* STEP 3 — defense (situation-picker fallback path) */}
          {step === STEP.DEFENSE && letterMode === "situation" && def && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">Your strongest defense</h2>
              <p className="mb-6 text-sm text-muted-foreground">Here's the argument we'll build, and exactly what to attach to make it stick.</p>
              <div className="rounded-xl border border-border bg-secondary/30 p-5">
                <h4 className="mb-2 flex flex-wrap items-center gap-3 text-base font-semibold">
                  {def.title}
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${def.strength === "strong" ? "bg-accent/15 text-accent" : def.strength === "moderate" ? "bg-[hsl(33_70%_40%/0.15)] text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]" : "bg-destructive/15 text-destructive"}`}>
                    {strengthLabel(def.strength)}
                  </span>
                </h4>
                <p className="mb-3 text-sm text-muted-foreground">{def.body}</p>
                <div className="rounded-md bg-background/60 px-4 py-3 text-xs">
                  <b className="text-foreground">Attach this evidence:</b>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {def.evidence.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>

                {def.legalBasis?.length > 0 && (
                  <div className="mt-4 rounded-md border border-border bg-background/60 px-4 py-3 text-xs" data-testid="section-legal-basis">
                    <b className="flex items-center gap-1.5 text-foreground">
                      <Scale size={14} className="shrink-0" /> Legal basis
                    </b>
                    <p className="mt-1 text-muted-foreground">The law and rulings this argument rests on. These citations are added to your appeal letter.</p>
                    <ul className="mt-2 space-y-2">
                      {def.legalBasis.map((c, i) => (
                        <li key={i} data-testid={`citation-${i}`}>
                          <a href={c.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline">
                            {c.authority}<ExternalLink size={11} className="shrink-0" />
                          </a>
                          <span className="block text-muted-foreground">{c.summary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                <Info size={18} className="mt-0.5 shrink-0" /><div>{def.note}</div>
              </div>
              <div className="mt-5">
                <label className={labelCls}>Add your own details <span className="font-normal text-muted-foreground/70">(optional but recommended)</span></label>
                <textarea className={`${inputCls} min-h-24 resize-y`} value={f.facts} onChange={setField("facts")} data-testid="input-facts"
                  placeholder="In a sentence or two, explain what happened in your own words. This gets added to your appeal." />
                <p className="mt-1 text-xs text-muted-foreground">Keep it factual. Avoid admitting you violated the rule.</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(STEP.SCAN)} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
                <button onClick={() => setStep(STEP.APPEAL)} data-testid="button-generate"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">Generate my appeal →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — defense fallback when situation path chosen but nothing picked */}
          {step === STEP.DEFENSE && letterMode === "situation" && !def && (
            <div data-testid="defense-empty">
              <h2 className="mb-1 text-xl font-semibold">Pick how you'll argue it</h2>
              <p className="mb-5 text-sm text-muted-foreground">You haven't selected a situation yet. Run the dismissal scan (recommended) or choose a situation to build your appeal around.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setStep(STEP.SCAN)} data-testid="defense-empty-scan"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate"><ScanLine size={16} /> Scan my ticket</button>
                <button onClick={() => setStep(STEP.SITUATION)} data-testid="defense-empty-situation"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">Pick a situation</button>
              </div>
            </div>
          )}

          {/* STEP 3 — dismissal / demand-proof lead argument (from the scan) */}
          {step === STEP.DEFENSE && (letterMode === "dismissal" || letterMode === "demand") && (
            <div data-testid="defense-scan">
              <h2 className="mb-1 text-xl font-semibold">{letterMode === "dismissal" ? "Your dismissal argument" : "File on time & put the City to its proof"}</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {letterMode === "dismissal"
                  ? "We'll lead your appeal with the ground(s) below and demand dismissal. Add any details, then generate your letter."
                  : "You don't have the ticket in hand and the clock is short. We'll file a not-guilty plea now and make the City produce the citation and prove every required element — then you can scan what they produce."}
              </p>

              {letterMode === "dismissal" && scanResult && scanResult.tier1.length > 0 && (
                <div className="rounded-xl border border-accent/40 bg-accent/5 p-5" data-testid="defense-scan-tier1">
                  <h4 className="mb-2 flex flex-wrap items-center gap-3 text-base font-semibold">
                    Mandatory-dismissal ground{scanResult.tier1.length > 1 ? "s" : ""}
                    <span className="rounded-full bg-accent/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-accent">T1 · Often accepted</span>
                  </h4>
                  <ul className="space-y-2">
                    {scanResult.tier1.map(({ field }) => (
                      <li key={field.id} className="text-sm">
                        <div className="font-semibold">{field.label}</div>
                        <a href={field.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">{field.citation}<ExternalLink size={11} /></a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {letterMode === "dismissal" && scanResult && scanResult.tier2.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-5" data-testid="defense-scan-tier2">
                  <h4 className="mb-2 text-base font-semibold">Bring this proof</h4>
                  <ul className="space-y-2">
                    {scanResult.tier2.map((g) => (
                      <li key={g.id} className="text-sm"><div className="font-semibold">{g.label}</div><div className="text-xs text-muted-foreground">{g.citation} · <b>Proof:</b> {g.proofNeeded}</div></li>
                    ))}
                  </ul>
                </div>
              )}

              {letterMode === "demand" && (
                <div className="rounded-xl border border-border bg-secondary/30 p-5 text-sm text-muted-foreground" data-testid="defense-demand">
                  Your letter will plead NOT GUILTY, demand the City prove the charge by substantial evidence (VTL § 240(2)(b)), and reserve the right to inspect the officer's record (VTL § 240(2)(d)) and to seek dismissal under § 238(2-a)(b) once the citation is produced.
                </div>
              )}

              <div className="mt-5">
                <label className={labelCls}>Add your own details <span className="font-normal text-muted-foreground/70">(optional)</span></label>
                <textarea className={`${inputCls} min-h-24 resize-y`} value={f.facts} onChange={setField("facts")} data-testid="input-facts-scan"
                  placeholder="In a sentence or two, add anything relevant in your own words. This gets added to your appeal." />
                <p className="mt-1 text-xs text-muted-foreground">Keep it factual. Avoid admitting you violated the rule.</p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(STEP.SCAN)} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back to scan</button>
                <button onClick={() => setStep(STEP.APPEAL)} data-testid="button-generate-scan"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">Generate my appeal →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — appeal */}
          {step === STEP.APPEAL && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">Your ready-to-send appeal</h2>
              <p className="mb-6 text-sm text-muted-foreground">Add your name and contact info, then send it. Email is the fastest channel.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Full name *</label><input className={inputCls} value={f.name} onChange={setField("name")} placeholder="Jane Doe" data-testid="input-name" /></div>
                <div><label className={labelCls}>Email *</label><input className={inputCls} value={f.email} onChange={setField("email")} placeholder="you@email.com" data-testid="input-email" /></div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Mailing address</label><input className={inputCls} value={f.address} onChange={setField("address")} placeholder="123 Main St, Albany, NY 12207" data-testid="input-address" /></div>
                <div><label className={labelCls}>Phone</label><input className={inputCls} value={f.phone} onChange={setField("phone")} placeholder="(518) 555-0100" data-testid="input-phone" /></div>
              </div>

              {/* Data transparency — accurate to the actual architecture: the letter
                  is built in-browser and sent via the user's own email app. Only the
                  optional photo/AI features send content to a server + AI provider. */}
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/40 px-4 py-3 text-xs text-muted-foreground" data-testid="text-data-statement">
                <Lock size={14} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  Your appeal is generated in your browser and sent through your own email app — your name and contact details aren't stored on our server.
                  The optional photo-reader and AI buttons are the exception: they send that content to our server and on to an AI provider to process it. {" "}
                  <a href="#/privacy" className="font-semibold text-primary underline-offset-2 hover:underline" data-testid="link-privacy-inline">How we handle your data</a>.
                </div>
              </div>

              {f.isCamera && (
                <div className="mt-5 flex items-start gap-3 rounded-lg bg-[hsl(33_70%_40%/0.12)] px-4 py-3 text-sm text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0" />
                  <div><b>This is a red-light or school-zone camera ticket.</b> Review the video first at <a className="underline" href="https://www.viewcitation.com" target="_blank" rel="noopener">viewcitation.com</a>, then appeal online there or by phone at 1-855-427-0455. The letter below works as your written statement.</div>
                </div>
              )}

              {/* AI polish controls */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={polishLetter} disabled={polishing} data-testid="button-polish"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover-elevate disabled:opacity-50">
                  {polishing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} className="text-primary" />}
                  {polished ? "Polish again" : "Polish my letter with AI"}
                </button>
                {polished && (
                  <button onClick={() => { setPolished(null); setPolishMsg(null); }} data-testid="button-polish-revert"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold hover-elevate">
                    <Undo2 size={15} /> Use the original
                  </button>
                )}
                {polished && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles size={12} /> AI-polished — review before sending
                  </span>
                )}
              </div>
              {polishMsg && (
                <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs ${polishMsg.kind === "ok" ? "bg-accent/12 text-accent" : "bg-destructive/12 text-destructive"}`} data-testid="text-polish-msg">
                  {polishMsg.kind === "ok" ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <Info size={15} className="mt-0.5 shrink-0" />}
                  <div>{polishMsg.text}</div>
                </div>
              )}

              <div className="mt-4 max-h-[440px] overflow-auto rounded-xl border border-border bg-secondary/30 p-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap" data-testid="text-letter">{displayLetter}</div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-secondary/30 p-5">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Mail size={18} /> Email it (fastest)</h4>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">Albany recommends email as the easiest, fastest way to appeal a parking ticket.</p>
                  <div className="mb-3 text-xs font-semibold">parkingticketappeal@albanyny.gov</div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={mailto} data-testid="button-email" className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover-elevate"><Mail size={16} /> Open in your email app</button>
                    <button onClick={() => printLetter(displayLetter, `Parking Ticket Appeal — Ticket ${f.ticket || ""}`)} data-testid="button-print" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Printer size={16} /> Save as PDF / print</button>
                    <button onClick={copy} data-testid="button-copy" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Copy size={16} /> {copied ? "Copied!" : "Copy text"}</button>
                  </div>
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground"><Paperclip size={13} className="mt-0.5 shrink-0" /> Your email app opens with the letter pre-filled, but it can't attach files for you — add your evidence photos/documents yourself before sending.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-5">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPin size={18} /> Or mail / visit in person</h4>
                  <p className="mb-2 text-xs text-muted-foreground">Parking Violations Bureau, City Hall</p>
                  <div className="mb-3 text-xs font-semibold leading-relaxed">24 Eagle St, Room 203<br />Albany, NY 12207</div>
                  <p className="text-xs text-muted-foreground">Open 8:30–4:45 (closed 12:30–1:30). Questions: 518-434-5006.</p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-lg bg-accent/12 px-4 py-3 text-sm text-accent">
                <Check size={18} className="mt-0.5 shrink-0" /><div><b>Before you send:</b> double-check the deadline, attach every piece of evidence from the previous step, and keep a copy of what you send.</div>
              </div>

              {/* What happens after I send? — kept general and non-committal.
                  We do NOT assert a specific response timeline because we could
                  not verify one from an official City source.
                  TODO(verify): exact PVB appeal-response window and the formal
                  denial/hearing procedure, from albanyny.gov primary source. */}
              <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5" data-testid="card-after-send">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Clock size={18} /> What happens after I send?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> The Parking Violations Bureau reviews your statement and the evidence. Keep your copy and a record of the date you sent it.</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> If a hearing is needed, the Bureau will contact you with a date and time — your letter already asks them to. Don't pay the ticket while you're contesting it; paying counts as pleading guilty.</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> If your appeal is denied, you can ask the Bureau about your options, including a hearing before a hearing examiner. Confirm the current procedure on the <a href="https://www.albanyny.gov/403/Parking-Violations-Bureau" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-2 hover:underline">City's official Parking Violations Bureau page</a>.</li>
                  <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> Want the City's own evidence — ticket photos, meter/payment logs, sign records, or camera calibration certificates? You can <button onClick={openFoil} data-testid="link-after-send-foil" className="font-semibold text-primary underline-offset-2 hover:underline">file a FOIL request</button> to compel the City to produce it.</li>
                </ul>
              </div>

              {/* FOIL entry card */}
              <button onClick={openFoil} data-testid="button-open-foil"
                className="mt-6 flex w-full items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 p-5 text-left transition hover-elevate">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><FolderOpen size={22} /></span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Make the City hand over its evidence (FOIL request)</div>
                  <div className="text-xs leading-snug text-muted-foreground">Demand the photos, meter logs, sign records, and camera certificates behind your ticket. We draft the legal letter and submit it for you.</div>
                </div>
                <span className="shrink-0 text-primary"><FileSearch size={18} /></span>
              </button>

              {/* Legal disclaimer surfaced on the Appeal step (same text as footer) */}
              <LegalDisclaimer className="mt-6 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground/80" />

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(STEP.DEFENSE)} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
                <button onClick={reset} data-testid="button-reset" className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">Start another ticket</button>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        <LegalDisclaimer className="mt-6 border-t border-dashed border-border pt-4 text-xs leading-relaxed text-muted-foreground/80" />
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-4xl space-y-3 px-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><Scale size={13} /> Who runs the Bureau (statutory authority)</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
              {BUREAU_AUTHORITY.map((c, i) => (
                <span key={i}>
                  <a className="underline" href={c.url} target="_blank" rel="noopener">{c.authority}</a> — {c.summary}{i < BUREAU_AUTHORITY.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            Sources: City of Albany Parking Violations Bureau official guidance (deadlines, appeal channels, accepted defenses) at <a className="underline" href="https://www.albanyny.gov/403/Parking-Violations-Bureau" target="_blank" rel="noopener">albanyny.gov</a>;
            parking evidence portal <a className="underline" href="https://albany.rmcpay.com/" target="_blank" rel="noopener">albany.rmcpay.com</a>;
            camera-ticket portal <a className="underline" href="https://www.viewcitation.com" target="_blank" rel="noopener">viewcitation.com</a>. Statutory and case citations link to NY Senate Open Legislation, NY courts, and Justia. Built for Albany residents — not affiliated with the City of Albany.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground/60">
            Note on camera tickets: Albany's school-zone speed cameras are governed by NY VTL §1180-f. NY VTL §1111-a red-light cameras apply only to New York City; Albany's authority for any red-light camera program is not established by a statute we could verify, so confirm the citation on your specific camera notice before relying on it.
          </p>
          <p className="text-xs text-muted-foreground/70">
            <a href="#/privacy" className="font-semibold text-primary underline-offset-2 hover:underline" data-testid="link-privacy-footer">Privacy &amp; your data</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
