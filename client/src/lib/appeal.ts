// Albany parking-ticket appeal logic — grounded in the City of Albany
// Parking Violations Bureau's published rules (deadlines, channels, accepted defenses).

export type TicketForm = {
  ticket: string;
  vdate: string;
  vtime: string;
  location: string;
  plate: string;
  state: string;
  make: string;
  model: string;
  violation: string;
  amount: string;
  isCamera: boolean;
  name: string;
  address: string;
  email: string;
  phone: string;
  facts: string;
};

export const emptyForm: TicketForm = {
  ticket: "", vdate: "", vtime: "", location: "", plate: "", state: "NY",
  make: "", model: "", violation: "", amount: "", isCamera: false,
  name: "", address: "", email: "", phone: "", facts: "",
};

export type Strength = "strong" | "moderate" | "weak";

export type Situation = {
  id: string;
  icon: string;
  title: string;
  sub: string;
};

export const SITUATIONS: Situation[] = [
  { id: "paid", icon: "Receipt", title: "I actually paid for parking", sub: "Meter or Park Albany app payment, but still ticketed" },
  { id: "wrongplate", icon: "Car", title: "Wrong plate or vehicle on the ticket", sub: "Plate, make, or state does not match my car" },
  { id: "signage", icon: "Signpost", title: "The sign was missing, hidden, or confusing", sub: "Obscured by trees, conflicting signs, or no visible sign" },
  { id: "meter", icon: "ParkingMeter", title: "The meter was broken", sub: "Meter or pay station malfunctioned or would not accept payment" },
  { id: "notmine", icon: "FileText", title: "I didn't own or wasn't driving the car", sub: "Sold, rented, or stolen vehicle at the time" },
  { id: "facts", icon: "TriangleAlert", title: "The ticket facts are wrong", sub: "Wrong date, time, location, or description" },
  { id: "medical", icon: "HeartPulse", title: "It was a genuine emergency", sub: "Medical emergency or vehicle suddenly disabled" },
  { id: "other", icon: "MessageSquare", title: "Something else / not sure", sub: "I'll explain in my own words" },
];

export type Citation = {
  authority: string; // e.g. "NY VTL § 238(2-a)(b)" or "Matter of Ryder Truck Rental v. PVB, 62 N.Y.2d 667 (1984)"
  summary: string; // plain-English of what it establishes
  url: string; // primary source
};

export type Defense = {
  strength: Strength;
  title: string;
  body: string;
  evidence: string[];
  note: string;
  legalBasis: Citation[];
};

export const DEFENSES: Record<string, Defense> = {
  paid: {
    strength: "strong",
    title: "Proof of payment",
    body: "Albany's Parking Violations Bureau states it is policy to waive overtime / non-payment tickets when the driver shows valid proof of payment. The most common cause is entering the wrong plate in the Park Albany app — but a correct, time-stamped receipt resolves it.",
    evidence: ["Paper receipt from the meter or pay tower for that exact date and time", "Park Albany app or credit-card e-receipt showing the session", "Bank or card statement line for the parking charge"],
    note: "Attach the receipt covering the ticket's exact date and time. If you paid but mistyped your plate, say so plainly and include the receipt — repeated wrong-plate appeals without proof are denied.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 240(2)(b)",
        summary: "No parking charge may be established except by substantial evidence; a time-stamped proof of payment directly rebuts a non-payment / overtime charge.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/240",
      },
      {
        authority: "Gruen v. Parking Violations Bureau, 58 A.D.2d 48 (1st Dep't 1977)",
        summary: "The ultimate burden of proof never shifts to the motorist; a credible sworn account plus a receipt forces the City to produce more than the ticket itself.",
        url: "https://www.casemine.com/judgement/us/591494a0add7b049345c032c",
      },
    ],
  },
  wrongplate: {
    strength: "strong",
    title: "Vehicle misidentification",
    body: "A parking ticket must correctly identify your vehicle. If the plate number, state, make, or body type on the citation does not match your vehicle, the citation fails to support a finding that YOUR vehicle committed the violation.",
    evidence: ["Photo of your actual license plate", "Vehicle registration showing plate, make, and model", "Screenshot of the ticket photo evidence showing the mismatch"],
    note: "Albany tickets now include photo/video evidence viewable at albany.rmcpay.com. Review it first — if the pictured plate or vehicle is not yours, screenshot it. Focus on the mismatch; do not admit the underlying violation.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 238(2-a)(b)",
        summary: "If any required identifying information on the ticket is omitted, misdescribed, or illegible, the violation SHALL be dismissed on the charged person's application.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/238",
      },
      {
        authority: "Matter of Ryder Truck Rental v. PVB, 62 N.Y.2d 667 (1984)",
        summary: "NY Court of Appeals: the five vehicle-identification elements (plate, plate type, expiration, make/model, body type) are mandatory; omitting any one requires dismissal.",
        url: "https://law.justia.com/cases/new-york/court-of-appeals/1984/62-n-y-2d-667-0.html",
      },
      {
        authority: "Matter of Wheels, Inc. v. PVB, 80 N.Y.2d 1014 (1992)",
        summary: "NY Court of Appeals: a misdescription of any mandatory identifying element (not just omission) also requires dismissal of the summons.",
        url: "https://law.justia.com/cases/new-york/court-of-appeals/1992/80-n-y-2d-1014-0.html",
      },
    ],
  },
  signage: {
    strength: "moderate",
    title: "Missing, obscured, or conflicting signage",
    body: "A parking restriction can only be enforced if the regulating sign is present and legible. If the sign was knocked down, fully blocked by tree branches, or two signs gave conflicting instructions, you could not have had fair notice of the restriction.",
    evidence: ["Dated photos of the sign as it appeared (obscured, missing, or blocked)", "A wide photo showing your space and the nearest signs in both directions", "The cross-streets so the location can be verified"],
    note: "Photograph the sign the same day if possible. Where two signs conflict, the less-restrictive one generally governs. This works best for non-safety zones; public-safety violations face a higher bar.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 1110(b)",
        summary: "A provision requiring signs cannot be enforced if, at the time and place, an official sign was not in proper position and sufficiently legible to be seen by an ordinarily observant person.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/1110",
      },
      {
        authority: "NY VTL \u00a7 1680(a) (MUTCD adoption)",
        summary: "Traffic-control devices must conform to the national MUTCD standard adopted by New York; a non-conforming sign is not a valid basis for enforcement.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/1680",
      },
    ],
  },
  meter: {
    strength: "moderate",
    title: "Inoperable or malfunctioning meter",
    body: "You are not responsible for a meter or pay station that malfunctioned through no fault of your own. If the meter would not accept payment, was dark or blank, or errored out, you had no working way to pay.",
    evidence: ["Photo of the meter screen showing the fault or error", "The meter or pay-station number", "Note of any attempt to pay via the Park Albany app and the error received"],
    note: "Record the meter number and a photo of the malfunction. If you then paid by app, include that proof too.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 240(2)(b)",
        summary: "The City must prove the charge by substantial evidence; evidence that the only available meter was inoperable undercuts a failure-to-pay charge.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/240",
      },
      {
        authority: "Gruen v. Parking Violations Bureau, 58 A.D.2d 48 (1st Dep't 1977)",
        summary: "A credible, not-patently-incredible sworn account (here, a documented meter malfunction) requires the City to come forward with more than the ticket.",
        url: "https://www.casemine.com/judgement/us/591494a0add7b049345c032c",
      },
    ],
  },
  notmine: {
    strength: "strong",
    title: "Not the owner or operator",
    body: "Liability for a parking ticket runs to the owner or operator of the cited vehicle at the time. If you had already sold the car, it was rented to someone else, or it was stolen, you are not the responsible party.",
    evidence: ["Bill of sale or transfer of title with the date", "Rental agreement showing the renter and dates", "Police report for a stolen vehicle or plate (required for theft)"],
    note: "For a stolen vehicle or plate, a filed police report is essentially required — Albany explicitly lists this as a valid legal defense. For a school-zone camera ticket, the statutory defenses below apply directly.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 1180-f(i) (Albany school-zone speed camera)",
        summary: "Affirmative defense to camera liability if the vehicle or its plates were reported stolen to police before the violation and not yet recovered (proved by certified police report).",
        url: "https://www.nysenate.gov/legislation/laws/VAT/1180-F",
      },
      {
        authority: "NY VTL \u00a7 1180-f(l)(2)",
        summary: "The owner is not liable where the vehicle was used without the owner's consent at the time of the violation.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/1180-F",
      },
      {
        authority: "NY VTL \u00a7 1180-f(k) (lessor / lessee)",
        summary: "A lessor is not liable if it files with the bureau and provides the lessee's name and address within 37 days; liability then runs to the lessee.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/1180-F",
      },
    ],
  },
  facts: {
    strength: "moderate",
    title: "The citation facts do not support the violation",
    body: "If the facts written on the ticket are internally inconsistent or simply wrong — wrong date, an impossible time, a location you never parked at, or a description that doesn't match — the citation does not support a finding that the regulation was violated.",
    evidence: ["Anything placing you or your car elsewhere at that date and time (receipts, GPS, tolls, photos)", "The ticket itself with the incorrect field circled", "The online photo evidence if it contradicts the written facts"],
    note: "Be specific: name the exact field that is wrong and what the correct fact is. Vague disagreement rarely wins; a concrete factual contradiction does.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 238(2-a)(b)",
        summary: "Omitted, misdescribed, or illegible required information on the ticket SHALL result in dismissal on the charged person's application.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/238",
      },
      {
        authority: "Young v. City of New York, 2007 NY Slip Op 51460(U)",
        summary: "A summons is only prima facie evidence; where the motorist's account disputing the facts is not patently incredible, the charge must be dismissed absent further City evidence.",
        url: "https://law.justia.com/cases/new-york/other-courts/2007/2007-51460.html",
      },
    ],
  },
  medical: {
    strength: "moderate",
    title: "Emergency or sudden vehicle disability",
    body: "Albany recognizes an evidence-supported medical emergency as a valid explanation. A sudden mechanical breakdown can also excuse a stop if the vehicle was moved as soon as practicable.",
    evidence: ["Proof of medical attention (ER, clinic, or ambulance record) for that date and time", "A tow receipt or repair invoice for a breakdown", "A short, dated timeline of what happened"],
    note: "Documentation is essential here — Albany requires the emergency to be evidence-supported. Without proof this is treated as a courtesy request, not a legal defense.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 240(2)(b)",
        summary: "The charge must rest on substantial evidence; a documented emergency provides a valid explanation that the hearing examiner weighs against the ticket.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/240",
      },
      {
        authority: "Mathews v. Eldridge, 424 U.S. 319 (1976)",
        summary: "Due process entitles you to a meaningful opportunity to present evidence and explanation before the City may impose a penalty.",
        url: "https://supreme.justia.com/cases/federal/us/424/319/",
      },
    ],
  },
  other: {
    strength: "moderate",
    title: "Your explanation",
    body: "You'll describe what happened in your own words. The Bureau will weigh a valid explanation, especially with supporting documents. Keep it factual and brief, and attach any evidence.",
    evidence: ["Any document that supports your account", "Photos of the location or vehicle", "A clear, dated timeline of events"],
    note: "State the facts plainly and avoid admitting the violation. Attach whatever proof you have.",
    legalBasis: [
      {
        authority: "NY VTL \u00a7 240(2)(b)",
        summary: "No parking or camera charge may be established except by substantial evidence at the hearing.",
        url: "https://www.nysenate.gov/legislation/laws/VAT/240",
      },
      {
        authority: "Matter of Walker v. City of New York, 262 A.D.2d 151 (1st Dep't 1999)",
        summary: "The ticket is only a prima facie case; the ultimate burden of proof stays with the City throughout the adjudication.",
        url: "https://casetext.com/case/in-matter-of-walker-v-city-of-new-york",
      },
    ],
  },
};

// Statutory authority for the Albany Parking Violations Bureau itself, shown as
// foundational context. Verified from NY Senate Open Legislation and Albany City Code.
export const BUREAU_AUTHORITY: Citation[] = [
  {
    authority: "NY General Municipal Law \u00a7\u00a7 370\u2013371",
    summary: "Authorizes a city to establish a parking/traffic violations bureau and sets its adjudication jurisdiction; the bureau cannot deny your right to counsel or to appear in court.",
    url: "https://www.nysenate.gov/legislation/laws/GMU/370",
  },
  {
    authority: "Albany City Code ch. 90 (Local Law No. 2-1983)",
    summary: "The local law that created Albany's Parking Violations Bureau and limits it to disposing of parking violations.",
    url: "https://ecode360.com/7680550",
  },
];

export const strengthLabel = (s: Strength) =>
  s === "strong" ? "Often accepted" : s === "moderate" ? "Case-by-case" : "Long shot";

// ---------------------------------------------------------------------------
// FOIL (Freedom of Information Law) request feature
// ---------------------------------------------------------------------------
// A resident can demand the underlying records that often PROVE a ticket should
// be dismissed: the meter/payment log, the sign maintenance record, the camera
// calibration & technician certificate, the photos behind the citation, etc.
// New York's FOIL (Public Officers Law Article 6, §§84–90) gives every person the
// right to these records, and the City must acknowledge within 5 business days.

// A selectable record category the resident can request. Each is tied to the
// situations where it's most useful, with a plain-English label and the precise
// records language that makes the request "reasonably described" under POL §89(3).
export type FoilRecord = {
  id: string;
  label: string; // layman-facing checkbox label
  detail: string; // formal records description inserted into the letter
  forSituations: string[]; // situation ids this record best supports ("*" = all)
};

export const FOIL_RECORDS: FoilRecord[] = [
  {
    id: "photos",
    label: "All photos and video behind my ticket",
    detail:
      "All photographs, video, and digital images captured in connection with the above citation, including any images of the vehicle, license plate, and surrounding signage.",
    forSituations: ["*"],
  },
  {
    id: "officer-notes",
    label: "The issuing officer's notes and record of the citation",
    detail:
      "The complete citation record and any contemporaneous notes, memo-book entries, or electronic-handheld data created by the issuing officer for the above citation.",
    forSituations: ["facts", "wrongplate", "other", "signage"],
  },
  {
    id: "payment-log",
    label: "The meter / pay-station payment log for that space and time",
    detail:
      "All meter, pay-station, and Park Albany (mobile payment) transaction logs for the parking space or zone at the cited location, for the date of the violation and the two hours before and after the cited time.",
    forSituations: ["paid", "meter"],
  },
  {
    id: "meter-maintenance",
    label: "The repair / maintenance history of the meter",
    detail:
      "All maintenance, repair, inspection, and malfunction records for the parking meter or pay station serving the cited location, for the 90 days preceding and including the date of the violation.",
    forSituations: ["meter", "paid"],
  },
  {
    id: "sign-records",
    label: "The installation & maintenance records for the sign",
    detail:
      "All sign installation, work-order, inspection, and maintenance records for every regulatory parking sign within 100 feet of the cited location, sufficient to show the sign's presence, placement, and condition on the date of the violation, including any records of damaged, missing, or obscured signs.",
    forSituations: ["signage"],
  },
  {
    id: "camera-cert",
    label: "The camera's calibration & the technician's certificate",
    detail:
      "For the photo-monitoring (red-light or school-zone speed camera) device that generated the above notice of liability: all calibration, testing, certification, and maintenance records for the device, and the affirmed certificate of the duly-trained technician relied upon as prima facie evidence (per NY VTL §1180-f(d)).",
    forSituations: ["notmine", "facts"],
  },
  {
    id: "camera-signage",
    label: "Proof the required camera-warning signs were posted",
    detail:
      "All records establishing that MUTCD-compliant photo-enforcement warning signs were installed and in place at the cited school speed zone on the date of the violation, as required by NY VTL §1180-f(a)(2).",
    forSituations: ["notmine", "signage"],
  },
  {
    id: "mailing-proof",
    label: "Proof of when the ticket / notice was mailed to me",
    detail:
      "All records establishing the date on which the citation or notice of liability was prepared, mailed, and served, including any certificate or log of mailing.",
    forSituations: ["*"],
  },
];

export type FoilForm = {
  records: string[]; // selected FoilRecord ids
  custom: string; // free-text additional records, in the resident's words
  format: "email" | "mail" | "inspect"; // preferred delivery of the records
};

export const emptyFoil: FoilForm = { records: [], custom: "", format: "email" };

// Which records to pre-suggest given the chosen situation.
export function suggestedFoilRecords(sitId: string | null): string[] {
  return FOIL_RECORDS.filter(
    (r) => r.forSituations.includes("*") || (sitId && r.forSituations.includes(sitId))
  ).map((r) => r.id);
}

// Verified legal basis for the FOIL right itself — shown in the UI and letter.
export const FOIL_AUTHORITY: Citation[] = [
  {
    authority: "NY Public Officers Law \u00a7 87",
    summary:
      "Establishes the public's right of access to government records and limits the fee for copies (no more than 25 cents per page for records up to 9 x 14 inches).",
    url: "https://www.nysenate.gov/legislation/laws/PBO/87",
  },
  {
    authority: "NY Public Officers Law \u00a7 89(3)",
    summary:
      "Requires an agency, within five business days of a request for a record reasonably described, to make the record available, deny in writing, or acknowledge receipt with an approximate date.",
    url: "https://www.nysenate.gov/legislation/laws/PBO/89",
  },
  {
    authority: "NY Public Officers Law \u00a7 89(4)(a)",
    summary:
      "Gives you the right to appeal any denial in writing within 30 days; the agency must then respond within 10 business days.",
    url: "https://www.nysenate.gov/legislation/laws/PBO/89",
  },
];

// Verified Albany FOIL submission facts.
export const FOIL_CONTACT = {
  rao: "City Clerk (Records Access Officer)",
  email: "clerk@albanyny.gov",
  addressLines: ["Office of the City Clerk \u2014 Records Access Officer", "City Hall, Room 202", "24 Eagle Street", "Albany, NY 12207"],
  phone: "518-434-5090",
  portalInfo: "https://www.albanyny.gov/230/Records-Access-FOIL",
  copyFee: "$0.25 per page",
  timeframe: "up to 20 business days",
};

export function buildFoilLetter(f: TicketForm, sitId: string, foil: FoilForm): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const selected = FOIL_RECORDS.filter((r) => foil.records.includes(r.id));
  const items = selected.map((r, i) => `  ${i + 1}. ${r.detail}`);
  if (foil.custom.trim()) items.push(`  ${items.length + 1}. ${foil.custom.trim()}`);
  const recordsBlock = items.length
    ? items.join("\n")
    : "  1. All records, photographs, and documentation in the City's possession relating to the citation identified above.";
  const deliver =
    foil.format === "email"
      ? "Please provide these records electronically by email where possible."
      : foil.format === "mail"
      ? "Please provide copies of these records by U.S. mail. I understand copies are $0.25 per page and ask to be notified before any charge exceeding $20 is incurred."
      : "I would first like to inspect these records in person at no charge, and will then identify any copies I wish to obtain.";
  const vehLine = [
    f.plate && `License plate: ${f.plate}${f.state ? ` (${f.state})` : ""}`,
    (f.make || f.model) && `Vehicle: ${[f.make, f.model].filter(Boolean).join(" ")}`,
  ].filter(Boolean).join("\n");

  return `${today}

${FOIL_CONTACT.rao}
City of Albany
${FOIL_CONTACT.addressLines.slice(1).join("\n")}
${FOIL_CONTACT.email}

RE: Freedom of Information Law (FOIL) request — records concerning Ticket No. ${f.ticket || "[TICKET NUMBER]"}
Date of violation: ${f.vdate ? fmtDate(f.vdate) : "[DATE]"}${f.location ? `\nLocation: ${f.location}` : ""}

Dear Records Access Officer:

Under the New York State Freedom of Information Law (Public Officers Law, Article 6, §§ 84–90), I request access to and copies of the following records held by the City of Albany${vehLine ? `, which concern my vehicle (${vehLine.replace(/\n/g, "; ")})` : ""}:

${recordsBlock}

${deliver}

If any portion of this request is denied, please cite the specific exemption under Public Officers Law § 87(2) that you claim authorizes the denial, and notify me of the records being withheld so that I may appeal as provided in § 89(4)(a).

As required by Public Officers Law § 89(3), please respond within five (5) business days by making the records available, denying the request in writing, or acknowledging receipt with an approximate date when the request will be granted or denied. I can be reached at the contact information below.

Thank you for your assistance.

Sincerely,
${f.name || "[YOUR NAME]"}
${f.address || "[YOUR MAILING ADDRESS]"}
${f.email || "[YOUR EMAIL]"}${f.phone ? `\n${f.phone}` : ""}`;
}

export function fmtDate(d: string): string {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function addDays(d: string, n: number): Date {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt;
}

export function deadlineInfo(f: TicketForm) {
  const days = f.isCamera ? 30 : 20;
  if (!f.vdate) return { days, deadline: null as Date | null, daysLeft: null as number | null };
  const deadline = addDays(f.vdate, days);
  const daysLeft = Math.ceil((deadline.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return { days, deadline, daysLeft };
}

export function buildLetter(f: TicketForm, sitId: string): string {
  const def = DEFENSES[sitId] || DEFENSES.other;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const vehLine = [
    f.plate && `License plate: ${f.plate}${f.state ? ` (${f.state})` : ""}`,
    (f.make || f.model) && `Vehicle: ${[f.make, f.model].filter(Boolean).join(" ")}`,
  ].filter(Boolean).join("\n");
  const facts = f.facts?.trim() ? `\n\nWhat happened:\n${f.facts.trim()}` : "";
  const legal = def.legalBasis?.length
    ? "\n\nLegal authority for this request:\n" +
      def.legalBasis.map((c) => `  \u2022 ${c.authority} \u2014 ${c.summary}`).join("\n")
    : "";
  return `${today}

City of Albany Parking Violations Bureau
24 Eagle Street, Room 203
Albany, NY 12207
parkingticketappeal@albanyny.gov

RE: Appeal of Parking Ticket No. ${f.ticket || "[TICKET NUMBER]"}
Date of violation: ${f.vdate ? fmtDate(f.vdate) : "[DATE]"}${f.location ? `\nLocation: ${f.location}` : ""}

To the Parking Violations Bureau:

I am writing to enter a plea of NOT GUILTY and to formally contest the above parking ticket. I respectfully request that this citation be dismissed for the reason set out below.

${vehLine ? vehLine + "\n\n" : ""}Grounds for dismissal — ${def.title}:
${def.body}${facts}${legal}

I have enclosed the following to support this appeal:
${def.evidence.map((e) => "  \u2022 " + e).join("\n")}

Because the ticket photo/video evidence and the facts above do not support a finding that I violated the cited regulation, I ask that the Bureau cancel this ticket. If a hearing is required, please advise me of the date and time so that I may appear and present this evidence.

Thank you for your time and consideration.

Sincerely,
${f.name || "[YOUR NAME]"}
${f.address || "[YOUR MAILING ADDRESS]"}
${f.email || "[YOUR EMAIL]"}${f.phone ? `\n${f.phone}` : ""}`;
}

// ============================================================================
// DISMISSAL-FIRST LETTERS (driven by the Ticket Error Scan)
// ----------------------------------------------------------------------------
// All authorities below come from VERIFIED-TICKET-DEFECT-LAW.md. These builders
// only ASSEMBLE grounds the scan confirmed from the user's own ticket (or that
// the City must produce); they never invent a defect or a citation.
// ============================================================================

// Neutral shape produced by ticketScan.toLetterGrounds(). Kept here (not
// imported from ticketScan) so appeal.ts has no dependency cycle.
export type LetterGround = {
  tier: 1 | 2;
  label: string;        // the exact field / fact at issue
  citation: string;     // authority text (verbatim-consistent with the doc)
  idElement?: boolean;  // one of the 5 mandatory ID elements (Ryder/Wheels)
  issue?: "omitted" | "misdescribed" | "illegible"; // § 238(2-a)(b) trigger
  requiresProof?: boolean;
  proofNeeded?: string;
};

const ALBANY_PVB_HEADER = `City of Albany Parking Violations Bureau
24 Eagle Street, Room 203
Albany, NY 12207
parkingticketappeal@albanyny.gov`;

const issueWord = (i?: LetterGround["issue"]) =>
  i === "omitted" ? "omitted from the notice"
  : i === "misdescribed" ? "misdescribed on the notice"
  : i === "illegible" ? "illegible on the notice"
  : "omitted, misdescribed, or illegible on the notice";

// Build the appeal AROUND the confirmed defect(s): lead with Tier-1 mandatory
// dismissal under § 238(2-a)(b) (+ Ryder/Wheels for ID elements), then any
// Tier-2 grounds with their required proof.
export function buildDismissalLetter(f: TicketForm, grounds: LetterGround[]): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const vehLine = [
    f.plate && `License plate: ${f.plate}${f.state ? ` (${f.state})` : ""}`,
    (f.make || f.model) && `Vehicle: ${[f.make, f.model].filter(Boolean).join(" ")}`,
  ].filter(Boolean).join("\n");

  const tier1 = grounds.filter((g) => g.tier === 1);
  const tier2 = grounds.filter((g) => g.tier === 2);

  let body = "";

  if (tier1.length) {
    const hasIdElement = tier1.some((g) => g.idElement);
    body += `This notice of violation is defective on its face and must be dismissed. Under NY Vehicle and Traffic Law § 238(2-a)(b), "if any information which is required to be inserted on a notice of violation is omitted from the notice of violation, misdescribed, or illegible, the violation shall be dismissed upon application of the person charged with the violation."\n\n`;
    body += `I hereby apply for that dismissal. The following required element${tier1.length > 1 ? "s are" : " is"} defective:\n`;
    body += tier1.map((g) => `  \u2022 ${g.label} \u2014 ${issueWord(g.issue)} (${g.citation}).`).join("\n");
    if (hasIdElement) {
      body += `\n\nThe New York Court of Appeals has held that the five mandatory vehicle-identification elements must each be correct: an omission requires dismissal (Matter of Ryder Truck Rental v. Parking Violations Bureau, 62 N.Y.2d 667 (1984)), and a misdescription of any one of them also mandates dismissal, with no "small error" exception (Matter of Wheels, Inc. v. Parking Violations Bureau, 80 N.Y.2d 1014 (1992)).`;
    }
  }

  if (tier2.length) {
    body += `${tier1.length ? "\n\n" : ""}I further contest this citation on the following ground${tier2.length > 1 ? "s" : ""}:\n`;
    body += tier2.map((g) => `  \u2022 ${g.label} (${g.citation}).${g.proofNeeded ? ` Supporting proof: ${g.proofNeeded}` : ""}`).join("\n");
    if (!tier1.length) {
      body += `\n\nThe City bears the burden of establishing the charge by substantial evidence (VTL § 240(2)(b)); I respectfully demand that it do so or dismiss the citation.`;
    }
  }

  const facts = f.facts?.trim() ? `\n\nWhat happened:\n${f.facts.trim()}` : "";

  return `${today}

${ALBANY_PVB_HEADER}

RE: Appeal of Parking Ticket No. ${f.ticket || "[TICKET NUMBER]"}
Date of violation: ${f.vdate ? fmtDate(f.vdate) : "[DATE]"}${f.location ? `\nLocation: ${f.location}` : ""}

To the Parking Violations Bureau:

I am writing to enter a plea of NOT GUILTY and to formally contest the above parking ticket.

${vehLine ? vehLine + "\n\n" : ""}${body}${facts}

Accordingly, I respectfully request that this citation be dismissed. If a hearing is required, please advise me of the date and time so that I may appear. As a person who has demanded a hearing, I note that no fine or penalty may be imposed prior to the hearing (VTL § 240.1-a; § 241(2)).

Thank you for your time and consideration.

Sincerely,
${f.name || "[YOUR NAME]"}
${f.address || "[YOUR MAILING ADDRESS]"}
${f.email || "[YOUR EMAIL]"}${f.phone ? `\n${f.phone}` : ""}`;
}

// No physical ticket + deadline near: file a timely NOT-GUILTY plea now and put
// the City to its proof. The Tier-1 scan is then run against the record the
// City produces. (Doc: "Deadline rule (overrides FOIL)".)
export function buildDemandProofLetter(f: TicketForm): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const vehLine = [
    f.plate && `License plate: ${f.plate}${f.state ? ` (${f.state})` : ""}`,
    (f.make || f.model) && `Vehicle: ${[f.make, f.model].filter(Boolean).join(" ")}`,
  ].filter(Boolean).join("\n");
  const facts = f.facts?.trim() ? `\n\nWhat happened:\n${f.facts.trim()}` : "";

  return `${today}

${ALBANY_PVB_HEADER}

RE: Appeal of Parking Ticket No. ${f.ticket || "[TICKET NUMBER]"}
Date of violation: ${f.vdate ? fmtDate(f.vdate) : "[DATE]"}${f.location ? `\nLocation: ${f.location}` : ""}

To the Parking Violations Bureau:

I am writing to enter a timely plea of NOT GUILTY and to contest the above parking ticket. I do not currently have the physical notice of violation in front of me, so I am filing within the appeal window and reserving my defenses.

${vehLine ? vehLine + "\n\n" : ""}Because no charge may be established except upon proof by substantial evidence (VTL § 240(2)(b)), and the burden rests with the City, I respectfully demand that the City produce the notice of violation and prove each required element of the charge. I further request, pursuant to VTL § 240(2)(d), the opportunity to inspect the issuing officer's record and any book, paper, or other thing relevant to the charge, and I reserve the right to subpoena the officer who served the notice.

I expressly reserve the right to seek dismissal under VTL § 238(2-a)(b) for any required element of the notice that is omitted, misdescribed, or illegible once the City produces the citation.${facts}

If a hearing is required, please advise me of the date and time so that I may appear. As a person who has demanded a hearing, no fine or penalty may be imposed prior to the hearing (VTL § 240.1-a; § 241(2)).

Thank you for your time and consideration.

Sincerely,
${f.name || "[YOUR NAME]"}
${f.address || "[YOUR MAILING ADDRESS]"}
${f.email || "[YOUR EMAIL]"}${f.phone ? `\n${f.phone}` : ""}`;
}

// ============================================================================
// CAMERA-TICKET STATEMENT (RLC / SZS) — raised at the PVB pre-trial conference
// ----------------------------------------------------------------------------
// Camera tickets are civil owner-liability and a DIFFERENT framework from
// parking. Authorities come from VERIFIED-CAMERA-DEFENSE-LAW.md. This builder
// only assembles grounds the user confirmed; for demand-proof items it generates
// language putting the City to its burden (logs / certificates / images).
// ============================================================================

// Neutral shape (mirrors cameraDefense.CameraLetterGround) to avoid a cycle.
export type CameraStatementGround = {
  label: string;
  citation: string;
  why: string;
  requiresProof: boolean;
  requiresCityProof: boolean;
};

export function buildCameraLetter(
  f: TicketForm,
  grounds: CameraStatementGround[],
  program: "szs" | "rlc"
): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const progName = program === "szs" ? "school-zone speed camera" : "red-light camera";
  const vehLine = [
    f.plate && `License plate: ${f.plate}${f.state ? ` (${f.state})` : ""}`,
    (f.make || f.model) && `Vehicle: ${[f.make, f.model].filter(Boolean).join(" ")}`,
  ].filter(Boolean).join("\n");

  const groundLines = grounds.length
    ? grounds.map((g, i) => {
        const ask = g.requiresCityProof
          ? " I demand that the City produce the records establishing this element; the burden is the City's."
          : g.requiresProof
          ? " I am prepared to provide supporting documentation of this."
          : "";
        return `  ${i + 1}. ${g.label} (${g.citation}). ${g.why}${ask}`;
      }).join("\n\n")
    : "  1. I contest liability and put the City to its proof on every required element of the charge.";

  return `${today}

City of Albany Parking Violations Bureau
24 Eagle Street, Room 203
Albany, NY 12207
(Pre-trial conference requested via viewcitation.com / 1-855-427-0455)

RE: Contest of ${progName} Notice of Liability No. ${f.ticket || "[CITATION NUMBER]"}
Date of violation: ${f.vdate ? fmtDate(f.vdate) : "[DATE]"}${f.location ? `\nLocation: ${f.location}` : ""}

To the Parking Violations Bureau:

I am the registered owner identified on the above ${progName} notice of liability, and I contest it. I do not admit liability and request a pre-trial conference. I understand this is a civil owner-liability matter; I raise the following ground(s):

${vehLine ? vehLine + "\n\n" : ""}${groundLines}

The sworn technician certificate is only prima facie evidence and may be rebutted; I request to inspect the photographs and/or video, which must be made available in this proceeding. I ask that this notice of liability be dismissed. Please advise me of the conference date and time.

Thank you for your time and consideration.

Sincerely,
${f.name || "[YOUR NAME]"}
${f.address || "[YOUR MAILING ADDRESS]"}
${f.email || "[YOUR EMAIL]"}${f.phone ? `\n${f.phone}` : ""}`;
}

/* ============================================================
   FOIL DENIAL APPEAL (Public Officers Law § 89(4)(a))
   When the City denies a FOIL request, ignores it past the
   5-business-day window, or constructively denies it, the
   requester may appeal in writing within 30 days. The appeal
   goes to the City's Appeals Officer (NOT the Records Access
   Officer — 21 NYCRR § 1401.7 forbids them being the same
   person), and a copy must be sent to the Committee on Open
   Government per § 89(4)(a).
   ============================================================ */

export type FoilAppealReason = "denied" | "noresponse" | "partial" | "fee";

export type FoilAppealForm = {
  reason: FoilAppealReason;
  requestDate: string;
  denialDate: string;
  agencyReason: string;
  records: string;
};

export const emptyFoilAppeal: FoilAppealForm = {
  reason: "denied",
  requestDate: "",
  denialDate: "",
  agencyReason: "",
  records: "",
};

export const FOIL_APPEAL_REASONS: { id: FoilAppealReason; label: string; detail: string }[] = [
  { id: "denied", label: "They denied my request", detail: "The City refused to give me some or all of the records I asked for." },
  { id: "noresponse", label: "They never responded", detail: "More than five business days passed with no records, no denial, and no acknowledgment — the law treats this as a denial." },
  { id: "partial", label: "They only gave me part of it", detail: "The City released some records but withheld or redacted others without adequate justification." },
  { id: "fee", label: "They charged an improper fee", detail: "The City demanded a fee that exceeds what the law allows (no more than $0.25 per page for ordinary copies)." },
];

export const FOIL_APPEAL_AUTHORITY: Citation[] = [
  {
    authority: "NY Public Officers Law \u00a7 89(4)(a)",
    summary:
      "Any person denied access may appeal in writing within 30 days to the agency's appeals officer, who must fully explain the further denial in writing, or grant access, within 10 business days \u2014 and must forward a copy of the appeal and determination to the Committee on Open Government.",
    url: "https://www.nysenate.gov/legislation/laws/PBO/89",
  },
  {
    authority: "NY Public Officers Law \u00a7 89(3)",
    summary:
      "Failure to respond within five business days (or by the acknowledged date) is a constructive denial that may itself be appealed.",
    url: "https://www.nysenate.gov/legislation/laws/PBO/89",
  },
  {
    authority: "NY Public Officers Law \u00a7 87(2)",
    summary:
      "An agency may withhold records only under a specific enumerated exemption, and it bears the burden of articulating a particularized justification \u2014 blanket or conclusory denials are improper.",
    url: "https://www.nysenate.gov/legislation/laws/PBO/87",
  },
  {
    authority: "NY Public Officers Law \u00a7 89(4)(c)",
    summary:
      "A requester who substantially prevails in a later court proceeding may be awarded reasonable attorney's fees and litigation costs where the agency had no reasonable basis for denying access.",
    url: "https://www.nysenate.gov/legislation/laws/PBO/89",
  },
];

export const FOIL_APPEAL_CONTACT = {
  appealsOfficer: "FOIL Appeals Officer",
  agencyLines: ["FOIL Appeals Officer", "Office of the City Clerk", "City Hall, Room 202", "24 Eagle Street", "Albany, NY 12207"],
  email: "clerk@albanyny.gov",
  coog: {
    name: "Committee on Open Government",
    lines: ["Committee on Open Government", "NYS Department of State", "One Commerce Plaza", "99 Washington Avenue", "Albany, NY 12231"],
    note: "\u00a7 89(4)(a) requires the City to forward your appeal and its determination to this state oversight body. Sending them a copy yourself helps ensure compliance.",
  },
};

export function buildFoilAppealLetter(f: TicketForm, ap: FoilAppealForm): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const reasonObj = FOIL_APPEAL_REASONS.find((r) => r.id === ap.reason) || FOIL_APPEAL_REASONS[0];
  const reqDate = ap.requestDate ? fmtDate(ap.requestDate) : "[DATE OF MY ORIGINAL REQUEST]";
  const denDate = ap.denialDate ? fmtDate(ap.denialDate) : "";

  let grievance = "";
  if (ap.reason === "denied") {
    grievance = `The City denied my request${denDate ? ` on ${denDate}` : ""}. Under Public Officers Law § 87(2), an agency may withhold records only by citing a specific statutory exemption and articulating a particularized and specific justification for doing so. ${ap.agencyReason.trim() ? `The stated reason — “${ap.agencyReason.trim()}” — does not meet that burden, and I ask that you review it and grant access.` : "No adequate, particularized justification was provided, and I ask that you grant access."}`;
  } else if (ap.reason === "noresponse") {
    grievance = `As of the date of this appeal, more than five business days have passed since my request${reqDate ? ` of ${reqDate}` : ""} with no records produced, no written denial, and no acknowledgment with an approximate response date. Under Public Officers Law § 89(3) and § 89(4)(a), this failure to respond constitutes a constructive denial, which I hereby appeal.`;
  } else if (ap.reason === "partial") {
    grievance = `The City released some records but withheld or redacted others${denDate ? ` (response dated ${denDate})` : ""}. Under Public Officers Law § 87(2), any redaction or withholding must be justified record-by-record under a specific exemption. ${ap.agencyReason.trim() ? `The explanation given — “${ap.agencyReason.trim()}” — is not sufficiently particularized.` : "No record-by-record justification was provided."} I appeal the withholding and ask that the remaining records be released or specifically justified.`;
  } else {
    grievance = `The City conditioned access on a fee that exceeds what the law permits. Under Public Officers Law § 87(1)(b), the fee for copies of records up to 9 by 14 inches may not exceed 25 cents per page, and inspection of records is free. ${ap.agencyReason.trim() ? `The charge described — “${ap.agencyReason.trim()}” — appears to exceed this limit.` : ""} I appeal the fee and ask that it be corrected.`;
  }

  const recordsLine = ap.records.trim()
    ? `The records at issue are: ${ap.records.trim()}`
    : "The records at issue are those described in my original FOIL request referenced above.";

  return `${today}

${FOIL_APPEAL_CONTACT.agencyLines.join("\n")}
${FOIL_APPEAL_CONTACT.email}

RE: FOIL APPEAL under Public Officers Law § 89(4)(a) — records concerning Albany Parking Ticket No. ${f.ticket || "[TICKET NUMBER]"}
Original request submitted: ${reqDate}${denDate ? `\nDenial / response dated: ${denDate}` : ""}

Dear FOIL Appeals Officer:

Pursuant to Public Officers Law § 89(4)(a), I hereby appeal the response to my Freedom of Information Law request described above. ${reasonObj.detail}

${recordsLine}

${grievance}

Public Officers Law § 89(4)(a) requires that, within ten (10) business days of receiving this appeal, you either fully explain in writing the reasons for any further denial or provide access to the records sought. It also requires that a copy of this appeal and your determination be forwarded to the Committee on Open Government. I am sending a copy of this appeal to that office as well.

Please be advised that if this appeal is denied and the matter proceeds to court, Public Officers Law § 89(4)(c) authorizes an award of reasonable attorney's fees and litigation costs to a requester who substantially prevails where the agency lacked a reasonable basis for denying access.

Thank you for your prompt attention to this appeal.

Sincerely,
${f.name || "[YOUR NAME]"}
${f.address || "[YOUR MAILING ADDRESS]"}
${f.email || "[YOUR EMAIL]"}${f.phone ? `\n${f.phone}` : ""}

cc: ${FOIL_APPEAL_CONTACT.coog.name}, NYS Department of State, One Commerce Plaza, 99 Washington Avenue, Albany, NY 12231`;
}

// ============================================================================
// CHECK MY OPEN TICKETS — official City of Albany lookup portal
// ----------------------------------------------------------------------------
// Source of truth: the City's "Ticketing and Enforcement" portal at
// https://albany.rmcpay.com/ (operated by Passport / rmcpay on behalf of the
// City of Albany Parking Violations Bureau). The portal lets a resident see all
// OPEN citations tied to their vehicle by license plate + state, by citation
// number, or by VIN.
//
// IMPORTANT — why this is a guided hand-off and NOT a server lookup:
// The portal's search endpoint (/rmcapi/api/.../searchviolation) is protected
// by AWS WAF "Human Verification" CAPTCHA and PerimeterX bot scoring. It rejects
// any non-interactive / server-side request (observed HTTP 403/405 + CAPTCHA).
// We therefore collect the plate + state in-app and hand the resident off to the
// official portal with clear instructions, rather than fabricating results we
// cannot truthfully retrieve. The state list below uses the portal's real
// state IDs (from getstates, operatorid 523) so the values stay accurate.
// ============================================================================

export type LookupState = { id: string; abbr: string; name: string };

// Pulled live from the portal's getstates endpoint (operatorid=523).
export const LOOKUP_STATES: LookupState[] = [
  { id: "81", abbr: "AL", name: "Alabama" },
  { id: "82", abbr: "AK", name: "Alaska" },
  { id: "83", abbr: "AZ", name: "Arizona" },
  { id: "84", abbr: "AR", name: "Arkansas" },
  { id: "85", abbr: "CA", name: "California" },
  { id: "86", abbr: "CO", name: "Colorado" },
  { id: "87", abbr: "CT", name: "Connecticut" },
  { id: "88", abbr: "DE", name: "Delaware" },
  { id: "131", abbr: "DC", name: "District of Columbia" },
  { id: "89", abbr: "FL", name: "Florida" },
  { id: "90", abbr: "GA", name: "Georgia" },
  { id: "663", abbr: "GU", name: "Guam" },
  { id: "91", abbr: "HI", name: "Hawaii" },
  { id: "92", abbr: "ID", name: "Idaho" },
  { id: "93", abbr: "IL", name: "Illinois" },
  { id: "94", abbr: "IN", name: "Indiana" },
  { id: "95", abbr: "IA", name: "Iowa" },
  { id: "96", abbr: "KS", name: "Kansas" },
  { id: "97", abbr: "KY", name: "Kentucky" },
  { id: "98", abbr: "LA", name: "Louisiana" },
  { id: "99", abbr: "ME", name: "Maine" },
  { id: "100", abbr: "MD", name: "Maryland" },
  { id: "101", abbr: "MA", name: "Massachusetts" },
  { id: "102", abbr: "MI", name: "Michigan" },
  { id: "103", abbr: "MN", name: "Minnesota" },
  { id: "104", abbr: "MS", name: "Mississippi" },
  { id: "105", abbr: "MO", name: "Missouri" },
  { id: "106", abbr: "MT", name: "Montana" },
  { id: "107", abbr: "NE", name: "Nebraska" },
  { id: "108", abbr: "NV", name: "Nevada" },
  { id: "109", abbr: "NH", name: "New Hampshire" },
  { id: "110", abbr: "NJ", name: "New Jersey" },
  { id: "111", abbr: "NM", name: "New Mexico" },
  { id: "112", abbr: "NY", name: "New York" },
  { id: "113", abbr: "NC", name: "North Carolina" },
  { id: "114", abbr: "ND", name: "North Dakota" },
  { id: "115", abbr: "OH", name: "Ohio" },
  { id: "116", abbr: "OK", name: "Oklahoma" },
  { id: "117", abbr: "OR", name: "Oregon" },
  { id: "118", abbr: "PA", name: "Pennsylvania" },
  { id: "495", abbr: "PR", name: "Puerto Rico" },
  { id: "119", abbr: "RI", name: "Rhode Island" },
  { id: "120", abbr: "SC", name: "South Carolina" },
  { id: "121", abbr: "SD", name: "South Dakota" },
  { id: "122", abbr: "TN", name: "Tennessee" },
  { id: "123", abbr: "TX", name: "Texas" },
  { id: "124", abbr: "UT", name: "Utah" },
  { id: "125", abbr: "VT", name: "Vermont" },
  { id: "613", abbr: "VI", name: "Virgin Islands" },
  { id: "126", abbr: "VA", name: "Virginia" },
  { id: "127", abbr: "WA", name: "Washington" },
  { id: "128", abbr: "WV", name: "West Virginia" },
  { id: "129", abbr: "WI", name: "Wisconsin" },
  { id: "130", abbr: "WY", name: "Wyoming" },
  { id: "193", abbr: "AB", name: "Alberta" },
  { id: "194", abbr: "BC", name: "British Columbia" },
  { id: "195", abbr: "MB", name: "Manitoba" },
  { id: "196", abbr: "NB", name: "New Brunswick" },
  { id: "197", abbr: "NL", name: "Newfoundland and Labrador" },
  { id: "198", abbr: "NT", name: "Northwest Territories" },
  { id: "199", abbr: "NS", name: "Nova Scotia" },
  { id: "200", abbr: "NU", name: "Nunavut" },
  { id: "201", abbr: "ON", name: "Ontario" },
  { id: "202", abbr: "PE", name: "Prince Edward Island" },
  { id: "203", abbr: "QC", name: "Quebec" },
  { id: "204", abbr: "SK", name: "Saskatchewan" },
  { id: "205", abbr: "YT", name: "Yukon" },
  { id: "466", abbr: "OT", name: "Other" },
  { id: "467", abbr: "GV", name: "US Government" },];

export const LOOKUP_PORTAL = {
  // Parking citations (meters, street parking, PVB tickets)
  parkingUrl: "https://albany.rmcpay.com/",
  // Red-light / school-zone speed camera tickets are handled separately
  // through the Citation Processing Center, not the parking portal.
  cameraUrl: "https://www.albanyny.gov/145/Pay-Bills-Tickets-Invoices",
  pvbInfoUrl: "https://www.albanyny.gov/403/Parking-Violations-Bureau",
};

// Normalize a user-typed state (abbr or full name) to the portal's option.
export function resolveLookupState(input: string): LookupState | null {
  if (!input) return null;
  const q = input.trim().toLowerCase();
  return (
    LOOKUP_STATES.find((s) => s.abbr.toLowerCase() === q) ||
    LOOKUP_STATES.find((s) => s.name.toLowerCase() === q) ||
    null
  );
}
