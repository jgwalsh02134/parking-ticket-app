// ============================================================================
// TICKET ERROR SCAN — dismissal-first checklist config
// ----------------------------------------------------------------------------
// SINGLE SOURCE OF LEGAL TRUTH: /VERIFIED-TICKET-DEFECT-LAW.md (repo root).
// Every citation, tier, and ground below maps 1:1 to that document. Do NOT add
// a statute, case, or ground that is not in the doc. If a new authority is ever
// needed, leave a // TODO(verify) for a human — never assert it as law.
//
// The app only asserts a defect the user can actually SEE on their ticket (or
// on a record the City produced). Unknown fields are never guessed.
// ============================================================================

import type { TicketForm, LetterGround } from "./appeal";

export type Tier = 1 | 2 | 3;

// A Tier-1 field verdict. The three "defect" values are the statutory triggers
// in VTL § 238(2-a)(b): omitted, misdescribed, illegible.
export type Verdict = "ok" | "omitted" | "misdescribed" | "illegible" | "unknown";

export const isDefect = (v: Verdict | undefined): boolean =>
  v === "omitted" || v === "misdescribed" || v === "illegible";

export type Conditional = "expired-meter-only" | "missing-only" | "posted-sign-only";

export type ScanField = {
  id: string;
  label: string;
  citation: string;      // authority string, verbatim-consistent with the doc
  url: string;           // primary source (reused from verified appeal.ts links)
  why: string;           // one-line plain-English "why it matters"
  idElement?: boolean;   // one of the 5 mandatory ID elements (Ryder / Wheels)
  conditional?: Conditional;
  formField?: keyof TicketForm; // printed value to surface from OCR / entry
  docRef: string;        // pointer back into VERIFIED-TICKET-DEFECT-LAW.md
};

// NY Senate Open Legislation + Justia URLs — these are the SAME verified links
// already used in appeal.ts for these authorities.
const URL_238 = "https://www.nysenate.gov/legislation/laws/VAT/238";
const URL_239 = "https://www.nysenate.gov/legislation/laws/VAT/239";
const URL_240 = "https://www.nysenate.gov/legislation/laws/VAT/240";
// TODO(verify): VTL § 241 NY Senate page URL — not previously used in this app.
const URL_241 = "https://www.nysenate.gov/legislation/laws/VAT/241";
const URL_RYDER = "https://law.justia.com/cases/new-york/court-of-appeals/1984/62-n-y-2d-667-0.html";
const URL_WHEELS = "https://law.justia.com/cases/new-york/court-of-appeals/1992/80-n-y-2d-1014-0.html";

// TIER 1 — required-field defects in win-probability order (doc: "RANKED
// COMMON-ERRORS CHECKLIST" 1→13). Each is self-proving on the user's ticket and
// triggers mandatory dismissal under § 238(2-a)(b).
export const TIER1_FIELDS: ScanField[] = [
  { id: "plate", label: "License plate number", idElement: true, formField: "plate",
    citation: "VTL § 238(2-a)(b); Matter of Ryder Truck Rental v. PVB, 62 N.Y.2d 667 (1984); Matter of Wheels, Inc. v. PVB, 80 N.Y.2d 1014 (1992)",
    url: URL_238,
    why: "The plate number is how the ticket proves it was YOUR vehicle. Wrong, missing, or unreadable means it identifies the wrong car.",
    docRef: "Tier 1 #1" },
  { id: "plateType", label: "Plate type (e.g. PAS, COM, OMT)", idElement: true,
    citation: "VTL § 238(2-a)(b); blank-field carve-out § 238(2-a)(a); Ryder/Wheels",
    url: URL_238,
    why: "Plate type is a required element. A blank field is only allowed if the plate was unreadable AND the ticket says so.",
    docRef: "Tier 1 #2" },
  { id: "regExpiration", label: "Registration expiration date", idElement: true,
    citation: "VTL § 238(2-a)(b); blank-field carve-out § 238(2-a)(a); Ryder/Wheels",
    url: URL_238,
    why: "The registration expiration is required. Blank is only allowed if unreadable and the ticket explains why.",
    docRef: "Tier 1 #3" },
  { id: "make", label: "Vehicle make", idElement: true, formField: "make",
    citation: "VTL § 238(2-a)(b); Ryder/Wheels",
    url: URL_238,
    why: "The make must match your car. 'Toyota' written on a Honda is a misdescription of a mandatory element.",
    docRef: "Tier 1 #4" },
  { id: "bodyType", label: "Body type (e.g. SUBN, 4DSD, MCY)", idElement: true,
    citation: "VTL § 238(2-a)(b); Matter of Wheels, Inc. v. PVB, 80 N.Y.2d 1014 (1992)",
    url: URL_WHEELS,
    why: "Body type must match. Wheels confirms a misdescribed body type alone is dismissible.",
    docRef: "Tier 1 #5" },
  { id: "state", label: "State of registration", formField: "state",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "The state that issued your plate is a required element. Wrong or missing issuing state is a defect.",
    docRef: "Tier 1 #6" },
  { id: "date", label: "Date of violation", formField: "vdate",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "The date of the violation is required. A missing, illegible, or impossible date is a defect.",
    docRef: "Tier 1 #7" },
  { id: "time", label: "Time of violation (incl. a.m./p.m.)", formField: "vtime",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "The time is required — including a.m./p.m. A missing am/pm designation is a defect.",
    docRef: "Tier 1 #8" },
  { id: "place", label: "Place / location of violation", formField: "location",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "The particular place must be specific enough to locate your car. A bare meter number is NOT a sufficient place.",
    docRef: "Tier 1 #9" },
  { id: "violationCode", label: "Violation code + plain-English description", formField: "violation",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "The violation needs BOTH the code and its plain-English description. Missing either is a defect.",
    docRef: "Tier 1 #10" },
  { id: "meterNumber", label: "Meter number", conditional: "expired-meter-only",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "For an EXPIRED-METER charge only, the meter number is required. (Not required for 'failure to display' charges.)",
    docRef: "Tier 1 #11" },
  { id: "officerId", label: "Officer / issuer ID", conditional: "missing-only",
    citation: "VTL § 238(2-a)(b)",
    url: URL_238,
    why: "A completely MISSING officer/issuer ID is a defect. A messy-but-present signature does NOT count (that is Tier 3).",
    docRef: "Tier 1 #12" },
  { id: "daysHours", label: "Days / hours the rule is in effect", conditional: "posted-sign-only",
    citation: "VTL § 238(2); § 238(2-a)(b)",
    url: URL_238,
    why: "For posted-sign violations (no-parking, street-cleaning, time-limited zones), the restricted days & hours are a required element.",
    docRef: "Tier 1 #13" },
];

export type Tier2Ground = {
  id: string;
  label: string;
  citation: string;
  url: string;
  why: string;
  question: string;     // yes/no prompt shown to the user
  proofNeeded: string;  // what evidence this ground requires
  docRef: string;
};

// TIER 2 — evidence / affirmative-defense grounds (doc: "TIER 2").
export const TIER2_GROUNDS: Tier2Ground[] = [
  { id: "substantial", label: "Make the City prove its case",
    citation: "VTL § 240(2)(b); subpoena right § 240(2)(d)",
    url: URL_240,
    why: "No charge may be established except by substantial evidence — the burden is on the City.",
    question: "Do you want to demand the City prove the violation (e.g. the officer's notes/photos look thin, missing, or contradictory)?",
    proofNeeded: "No proof required from you up front — you demand the City's proof and may subpoena the officer and records (§ 240(2)(d)).",
    docRef: "Tier 2 #1" },
  { id: "signage", label: "Sign was missing, obscured, or contradictory",
    citation: "VTL § 240(2)(b); § 238(2)",
    url: URL_240,
    why: "If the regulation wasn't validly posted, the place / applicable-rule elements and the substantial-evidence requirement are in play.",
    question: "Was the posted sign missing, knocked down, obscured, or contradictory?",
    proofNeeded: "A dated photo of the sign as it appeared, and the cross-streets. (You can FOIL the sign maintenance records in parallel.)",
    docRef: "Tier 2 #2" },
  { id: "stolen", label: "Vehicle was stolen",
    citation: "VTL § 239(3)",
    url: URL_239,
    why: "A vehicle reported stolen before the violation and not yet recovered is a complete statutory defense.",
    question: "Was the vehicle reported to police as stolen before the violation, and not yet recovered at that time?",
    proofNeeded: "A certified copy of the police stolen-vehicle report, mailed to the bureau.",
    docRef: "Tier 2 #3" },
  { id: "lease", label: "Wrong party — leased / rented vehicle",
    citation: "VTL § 239(2)(b)",
    url: URL_239,
    why: "Liability transfers to the lessee; a lessor (or wrongly-billed renter) can be dismissed with the agreement.",
    question: "Is the cited party a rental/lease company, or were you wrongly billed as owner of a leased vehicle?",
    proofNeeded: "The lease or rental agreement identifying the responsible lessee.",
    docRef: "Tier 2 #4" },
  { id: "staleness", label: "Ticket is stale / improper default",
    citation: "VTL § 241(2)",
    url: URL_241,
    why: "A default judgment can't be entered more than two years after the plea deadline, and 30-day notice is required first.",
    question: "Is the ticket very old, or is the City threatening a default judgment?",
    proofNeeded: "The relevant dates (violation date, any notice you received). § 241(2) bars default >2 years after the plea deadline.",
    docRef: "Tier 2 #5" },
];

export type Tier3Trap = {
  id: string;
  label: string;
  warning: string;
  docRef: string;
};

// TIER 3 — commonly claimed but NOT dismissible (substantial-compliance).
export const TIER3_TRAPS: Tier3Trap[] = [
  { id: "color", label: "Wrong vehicle color",
    warning: "Color is not a required element of the ticket. NYC DOF states outright it is not a valid defense — this will almost certainly LOSE on its own.",
    docRef: "Tier 3 #1" },
  { id: "year", label: "Wrong vehicle year",
    warning: "Model year is not a required element. Not a defense on its own — this will almost certainly LOSE.",
    docRef: "Tier 3 #2" },
  { id: "spelling", label: "Minor make/model misspelling",
    warning: "If the car is still identifiable (e.g. 'Chevy' vs 'Chevrolet'), substantial compliance applies — not a defense on its own.",
    docRef: "Tier 3 #3" },
  { id: "address", label: "Minor address abbreviation",
    warning: "If the place is still identifiable, a minor abbreviation/formatting difference is not a defense on its own.",
    docRef: "Tier 3 #4" },
  { id: "illegibleSig", label: "Illegible (but present) officer signature",
    warning: "Per NYC DOF the signature need not be legible. A messy-but-present signature is not a defense on its own.",
    docRef: "Tier 3 #5" },
];

export type ScanContext = { isExpiredMeter: boolean; isPostedSign: boolean };

// Which Tier-1 fields to walk, honoring the conditional flags.
export function visibleTier1Fields(ctx: ScanContext): ScanField[] {
  return TIER1_FIELDS.filter((f) => {
    if (f.conditional === "expired-meter-only") return ctx.isExpiredMeter;
    if (f.conditional === "posted-sign-only") return ctx.isPostedSign;
    return true;
  });
}

export type ScanResult = {
  tier1: { field: ScanField; verdict: Verdict }[]; // confirmed defects, in order
  tier2: Tier2Ground[];
  tier3: Tier3Trap[];
  unknown: ScanField[];          // "can't tell" — feeds the demand-proof path
  hasDismissalGround: boolean;   // any Tier-1 defect
  hasAnyGround: boolean;         // Tier-1 or Tier-2
};

export function computeScanResult(
  verdicts: Record<string, Verdict>,
  tier2Ids: string[],
  tier3Ids: string[],
  ctx: ScanContext
): ScanResult {
  const fields = visibleTier1Fields(ctx);
  const tier1 = fields
    .filter((f) => isDefect(verdicts[f.id]))
    .map((f) => ({ field: f, verdict: verdicts[f.id] }));
  const unknown = fields.filter((f) => verdicts[f.id] === "unknown");
  const tier2 = TIER2_GROUNDS.filter((g) => tier2Ids.includes(g.id));
  const tier3 = TIER3_TRAPS.filter((t) => tier3Ids.includes(t.id));
  return {
    tier1,
    tier2,
    tier3,
    unknown,
    hasDismissalGround: tier1.length > 0,
    hasAnyGround: tier1.length > 0 || tier2.length > 0,
  };
}

// ============================================================================
// USER-ASSISTED PORTAL PULL — deterministic paste parser
// ----------------------------------------------------------------------------
// The official portal (albany.rmcpay.com) is CAPTCHA/WAF-protected and must NOT
// be fetched/scraped. Instead the user pastes their citation-detail text and we
// parse it HERE, on-device, with conservative label matching. Anything we can't
// confidently match is left empty ("not shown") — never guessed or fabricated.
// ============================================================================

export type ParsedCitation = {
  form: Partial<TicketForm>;          // values that map to existing form fields
  scanValues: Record<string, string>; // scan-only fields (plateType, bodyType, …)
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Grab the value after a "Label: value" (or "Label  value") pair, case-insensitive.
function grab(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\n)[\\t ]*${escapeRe(label)}[\\t ]*[:#\\-]?[\\t ]*(.+)`, "i");
    const m = text.match(re);
    if (m && m[1]) {
      const v = m[1].split(/\n/)[0].trim();
      if (v && !/^[:#\-]+$/.test(v)) return v;
    }
  }
  return "";
}

// Conservatively normalize a US date to YYYY-MM-DD; return "" if not confident.
function normDate(s: string): string {
  const m = s.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (!m) {
    const iso = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : "";
  }
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return "";
  return `${year}-${mm}-${dd}`;
}

export function parseCitationText(text: string): ParsedCitation {
  const form: Partial<TicketForm> = {};
  const scanValues: Record<string, string> = {};
  if (!text || !text.trim()) return { form, scanValues };

  const ticket = grab(text, ["citation number", "citation no", "citation #", "citation", "ticket number", "ticket no", "ticket #", "violation number", "notice number"]);
  if (ticket) form.ticket = ticket;

  const plate = grab(text, ["license plate", "plate number", "plate designation", "plate no", "license plate number", "plate"]);
  if (plate) form.plate = plate;

  const state = grab(text, ["state of registration", "plate state", "registration state", "state"]);
  if (state) form.state = state.toUpperCase().length <= 3 ? state.toUpperCase() : state;

  const make = grab(text, ["vehicle make", "make"]);
  if (make) form.make = make;

  const model = grab(text, ["vehicle model", "model"]);
  if (model) form.model = model;

  const rawDate = grab(text, ["violation date", "date of violation", "issue date", "date"]);
  const vdate = normDate(rawDate || text);
  if (vdate) form.vdate = vdate;

  const time = grab(text, ["violation time", "time of violation", "issue time", "time"]);
  if (time) form.vtime = time;

  const location = grab(text, ["location", "place of occurrence", "violation location", "address", "street"]);
  if (location) form.location = location;

  const violation = grab(text, ["violation description", "violation code", "violation", "charge", "infraction"]);
  if (violation) form.violation = violation;

  const amount = grab(text, ["amount due", "fine amount", "amount", "total due", "fine"]);
  if (amount) form.amount = amount;

  // Scan-only fields (no slot in TicketForm) — surfaced as printed values in the scan.
  const plateType = grab(text, ["plate type"]);
  if (plateType) scanValues.plateType = plateType;
  const regExp = grab(text, ["registration expiration", "expiration date", "reg expiration", "expires"]);
  if (regExp) scanValues.regExpiration = regExp;
  const bodyType = grab(text, ["body type", "body", "vehicle body"]);
  if (bodyType) scanValues.bodyType = bodyType;
  const meter = grab(text, ["meter number", "meter no", "meter #", "meter"]);
  if (meter) scanValues.meterNumber = meter;
  const officer = grab(text, ["officer", "officer id", "badge", "shield", "issuer", "issued by"]);
  if (officer) scanValues.officerId = officer;
  const daysHours = grab(text, ["days/hours", "days and hours", "hours in effect", "in effect"]);
  if (daysHours) scanValues.daysHours = daysHours;

  return { form, scanValues };
}

// ============================================================================
// CAPTURE COVERAGE — what a portal screenshot did / didn't include
// ----------------------------------------------------------------------------
// After OCR reads an uploaded screenshot/PDF, we report which citation fields
// came through and which are missing, so the user can retake a fuller capture.
// "core" fields should appear on essentially any citation-detail page; the rest
// may be lower on the page or simply not applicable to the charge.
// ============================================================================

export type CoverageField = {
  id: string;
  label: string;
  core: boolean;
  formField?: keyof TicketForm; // where the value lives (else scanValues[id])
};

export const COVERAGE_FIELDS: CoverageField[] = [
  { id: "ticket", label: "Citation / ticket number", core: true, formField: "ticket" },
  { id: "plate", label: "License plate", core: true, formField: "plate" },
  { id: "state", label: "State of registration", core: true, formField: "state" },
  { id: "date", label: "Date of violation", core: true, formField: "vdate" },
  { id: "time", label: "Time of violation", core: true, formField: "vtime" },
  { id: "place", label: "Place / location", core: true, formField: "location" },
  { id: "violationCode", label: "Violation code + description", core: true, formField: "violation" },
  { id: "make", label: "Vehicle make", core: true, formField: "make" },
  { id: "bodyType", label: "Body type", core: false },
  { id: "plateType", label: "Plate type", core: false },
  { id: "regExpiration", label: "Registration expiration", core: false },
  { id: "meterNumber", label: "Meter number", core: false },
  { id: "officerId", label: "Officer / issuer ID", core: false },
  { id: "daysHours", label: "Days / hours in effect", core: false },
];

export type Coverage = {
  present: CoverageField[];
  missingCore: CoverageField[];
  missingOther: CoverageField[];
};

export function captureCoverage(
  form: Partial<TicketForm>,
  scanValues: Record<string, string>
): Coverage {
  const val = (cf: CoverageField): string =>
    (cf.formField ? String(form[cf.formField] ?? "") : scanValues[cf.id] ?? "").trim();
  const present = COVERAGE_FIELDS.filter((cf) => val(cf));
  const missing = COVERAGE_FIELDS.filter((cf) => !val(cf));
  return {
    present,
    missingCore: missing.filter((m) => m.core),
    missingOther: missing.filter((m) => !m.core),
  };
}

// Map confirmed scan grounds into the letter generator's neutral shape.
// Tier-1 leads; Tier-2 follows. Tier-3 is never included.
export function toLetterGrounds(result: ScanResult): LetterGround[] {
  const grounds: LetterGround[] = [];
  for (const { field, verdict } of result.tier1) {
    grounds.push({
      tier: 1,
      label: field.label,
      citation: field.citation,
      idElement: field.idElement,
      issue: verdict === "ok" || verdict === "unknown" ? undefined : verdict,
    });
  }
  for (const g of result.tier2) {
    grounds.push({
      tier: 2,
      label: g.label,
      citation: g.citation,
      requiresProof: true,
      proofNeeded: g.proofNeeded,
    });
  }
  return grounds;
}
