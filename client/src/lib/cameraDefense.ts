// ============================================================================
// CAMERA-TICKET DEFENSE — Red-Light (RLC) & School-Zone Speed (SZS)
// ----------------------------------------------------------------------------
// SINGLE SOURCE OF LEGAL TRUTH: /VERIFIED-CAMERA-DEFENSE-LAW.md (repo root).
// Camera tickets are a DIFFERENT legal animal from parking tickets — the VTL
// § 238 parking-defect grounds do NOT apply. Cite ONLY what is in the doc.
//   - SZS → VTL § 1111-d / Chapter 500 of the Laws of 2023 (NOT § 1180-b).
//   - RLC → VTL § 1111-a.
// Never assert a device defect the user can't substantiate — instead DEMAND the
// City produce the log/certificate/images (their burden).
// ============================================================================

import type { TicketForm } from "./appeal";

export type CameraProgram = "szs" | "rlc";
export type CameraTier = 1 | 2 | 3 | 4 | 5;

export type CameraItem = {
  id: string;
  program: CameraProgram;
  tier: CameraTier;
  label: string;
  citation: string;            // verbatim authority from the doc
  url: string;
  why: string;                 // one-line plain-English rationale
  question: string;            // confirm prompt shown to the user
  requiresProof: boolean;      // user must supply evidence (photo, police report)
  requiresCityProof: boolean;  // letter DEMANDS the City produce a log/cert/images
};

// Primary-source URLs from the doc.
const URL_1111A = "https://www.nysenate.gov/legislation/laws/VAT/1111-A";
const URL_1111D = "https://www.nysenate.gov/legislation/bills/2023/S6802/amendment/A"; // Ch. 500 of 2023 (S.6802)
const URL_239 = "https://www.nysenate.gov/legislation/laws/VAT/239";
const URL_SZS_FAQ = "https://albanyny.gov/faq.aspx?TID=56";
const URL_PVB = "https://www.albanyny.gov/403/Parking-Violations-Bureau";

// ---- SCHOOL-ZONE SPEED (SZS) — VTL § 1111-d / Ch. 500 of 2023 --------------
export const SZS_CHECKLIST: CameraItem[] = [
  { id: "szs-speed-margin", program: "szs", tier: 1,
    label: "Speed margin — more than 10 mph over the limit",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "Liability attaches ONLY if the recorded speed is MORE than 10 mph over the school-zone limit. In a 20 mph zone you must be over 30 mph. At or under that, you are not liable.",
    question: "Read the recorded speed on your notice. Was it 10 mph or LESS over the posted limit (e.g. 30 or under in a 20 zone)?",
    requiresProof: false, requiresCityProof: false },
  { id: "szs-enforcement-window", program: "szs", tier: 1,
    label: "Outside the camera's enforcement window",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023; Albany SZS program rules",
    url: URL_SZS_FAQ,
    why: "Cameras only enforce on school days during the posted hours (generally 7 a.m.–6 p.m.; summer windows differ per camera). A stamp outside that camera's posted window isn't enforceable. (Note: 5:55 p.m. is INSIDE a 6 p.m. window — close calls won't win.)",
    question: "Compare the time/date stamp on your notice to that camera's posted enforcement window. Was it OUTSIDE the active hours or on a non-school day?",
    requiresProof: false, requiresCityProof: false },
  { id: "szs-location-authority", program: "szs", tier: 1,
    label: "Outside a valid/authorized school speed zone",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "The camera must be within a valid school speed zone (≤1,320 ft of the school) and one of the ≤20 authorized Albany zones; the program is repealed Dec 31, 2028.",
    question: "Do you have reason to believe the camera was outside a valid/authorized school zone (or the date is after Dec 31, 2028)?",
    requiresProof: false, requiresCityProof: false },
  { id: "szs-device-proof", program: "szs", tier: 2,
    label: "Demand the daily self-test log + annual calibration certificate",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "The system can't be used unless it passed a daily self-test (signed set-up log), and each device needs an annual independent-lab calibration certificate. These are the City's burden to have — demand them; if missing/deficient, the prima-facie certificate is rebutted.",
    question: "Want to demand the City produce the daily self-test set-up log and the annual calibration certificate for that camera and date?",
    requiresProof: false, requiresCityProof: true },
  { id: "szs-signage", program: "szs", tier: 3,
    label: "Missing or non-conforming photo-enforcement signage",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023; MUTCD; Albany SZS FAQ",
    url: URL_SZS_FAQ,
    why: "Each zone must post MUTCD-conforming signage showing the speed limit, the enforcement time, and that it is photo enforced. Genuinely absent or non-conforming signage is contestable.",
    question: "Was the required signage (speed limit + enforcement time + 'photo enforced') missing or non-conforming at that location?",
    requiresProof: true, requiresCityProof: false },
  { id: "szs-stolen", program: "szs", tier: 4,
    label: "Stolen vehicle / stolen plates",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "Complete defense if the vehicle or plates were reported stolen to police before the violation and not yet recovered.",
    question: "Was the vehicle or its plates reported stolen to police before the violation and not recovered at that time?",
    requiresProof: true, requiresCityProof: false },
  { id: "szs-lessor", program: "szs", tier: 4,
    label: "Leased / rented — wrong party",
    citation: "VTL § 239(2)(b)",
    url: URL_239,
    why: "A lessor who pre-filed and provides the lessee's name/address within 37 days of notice shifts liability to the lessee.",
    question: "Was the vehicle leased or rented to someone else (and you're a lessor or wrongly billed)?",
    requiresProof: true, requiresCityProof: false },
  { id: "szs-noconsent", program: "szs", tier: 4,
    label: "Operated without the owner's consent (narrow)",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "Narrow defense that rebuts the consent presumption — hard to prove.",
    question: "Was the vehicle used without your consent at the time (and you can show it)?",
    requiresProof: true, requiresCityProof: false },
  { id: "szs-malfunction", program: "szs", tier: 4,
    label: "Device malfunction",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "It is an express statutory defense that the camera system was malfunctioning at the time. Demand the records that would show it was working.",
    question: "Do you have reason to believe the camera system was malfunctioning at the time?",
    requiresProof: false, requiresCityProof: true },
  { id: "szs-warning-grace", program: "szs", tier: 5,
    label: "Inside the 30-day warning grace period",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023; Albany SZS FAQ",
    url: URL_SZS_FAQ,
    why: "For the first 30 days a newly activated camera is live, only warnings issue — no fine. A 'fine' dated inside that camera's warning window is improper.",
    question: "Was this a fine (not a warning) that may fall within the camera's first-30-days activation window?",
    requiresProof: false, requiresCityProof: true },
  { id: "szs-notice-contents", program: "szs", tier: 5,
    label: "Required notice contents missing",
    citation: "VTL § 1111-d / Ch. 500 of the Laws of 2023",
    url: URL_1111D,
    why: "The notice must include at least two date-and-time-stamped rear images (showing the same stationary object) and the sworn certificate, plus owner/plate/location/date-time/camera ID. Missing required content is contestable.",
    question: "Is the notice missing required content (e.g. fewer than two time-stamped images, or no sworn certificate)?",
    requiresProof: false, requiresCityProof: false },
];

// ---- RED-LIGHT (RLC) — VTL § 1111-a ----------------------------------------
export const RLC_CHECKLIST: CameraItem[] = [
  { id: "rlc-image-proof", program: "rlc", tier: 1,
    label: "Images don't clearly show a steady-red entry",
    citation: "VTL § 1111-a",
    url: URL_1111A,
    why: "The system must produce two or more photos/microphotographs or video showing the vehicle entering against a STEADY red. Inspect them; if they don't clearly show that, contest.",
    question: "After inspecting the images at viewcitation.com: do they FAIL to clearly show your vehicle entering against a steady red (e.g. blurry, wrong vehicle/lane, or the light isn't clearly red)?",
    requiresProof: false, requiresCityProof: true },
  { id: "rlc-prior-conviction", program: "rlc", tier: 1,
    label: "Operator separately convicted of the underlying violation",
    citation: "VTL § 1111-a(b)",
    url: URL_1111A,
    why: "If the operator was separately CONVICTED of the underlying § 1111(d) red-light violation, the owner is NOT liable (no double liability).",
    question: "Was the driver separately convicted of the underlying red-light violation in court?",
    requiresProof: true, requiresCityProof: false },
  { id: "rlc-signal-malfunction", program: "rlc", tier: 2,
    label: "Signal was malfunctioning",
    citation: "VTL § 1111-a(n)",
    url: URL_1111A,
    why: "Express statutory defense that the traffic-control indications were malfunctioning at the time.",
    question: "Was the traffic signal malfunctioning at the time?",
    requiresProof: true, requiresCityProof: false },
  { id: "rlc-stolen", program: "rlc", tier: 2,
    label: "Stolen vehicle",
    citation: "VTL § 1111-a(i)",
    url: URL_1111A,
    why: "Complete defense if reported stolen to police before the violation and not yet recovered; mail a certified copy of the police report to the PVB.",
    question: "Was the vehicle reported stolen to police before the violation and not recovered at that time?",
    requiresProof: true, requiresCityProof: false },
  { id: "rlc-lessor", program: "rlc", tier: 2,
    label: "Leased / rented — wrong party",
    citation: "VTL § 1111-a(j)",
    url: URL_1111A,
    why: "A lessor shifts liability to the lessee with the lease documents and the lessee's name/address within 37 days.",
    question: "Was the vehicle leased or rented to someone else (and you're a lessor or wrongly billed)?",
    requiresProof: true, requiresCityProof: false },
  { id: "rlc-noconsent", program: "rlc", tier: 2,
    label: "Operated without the owner's consent (narrow)",
    citation: "VTL § 1111-a(k)(2)",
    url: URL_1111A,
    why: "Narrow defense that rebuts the consent presumption.",
    question: "Was the vehicle used without your consent at the time (and you can show it)?",
    requiresProof: true, requiresCityProof: false },
  { id: "rlc-certificate", program: "rlc", tier: 3,
    label: "Demand to inspect the images behind the certificate",
    citation: "VTL § 1111-a",
    url: URL_1111A,
    why: "The sworn technician certificate is only prima facie evidence — the images shall be available for inspection in any proceeding. Demand and inspect them.",
    question: "Want to formally demand the City make the photographs/video available for inspection?",
    requiresProof: false, requiresCityProof: true },
  { id: "rlc-notice-contents", program: "rlc", tier: 3,
    label: "Required notice contents missing",
    citation: "VTL § 1111-a(g)(2)–(3)",
    url: URL_1111A,
    why: "The notice must include owner name/address, plate, location, date/time, camera/locator ID, how/when to contest, and the default-judgment warning. Missing required content is contestable.",
    question: "Is the notice missing any required content listed above?",
    requiresProof: false, requiresCityProof: false },
];

export function checklistFor(program: CameraProgram): CameraItem[] {
  return program === "szs" ? SZS_CHECKLIST : RLC_CHECKLIST;
}

// Things commonly believed to work but that don't — warn, never build on these.
export const CAMERA_TRAPS: { id: string; label: string; warning: string }[] = [
  { id: "not-driver", label: "\u201CI wasn't the one driving\u201D",
    warning: "Camera tickets are civil OWNER liability — the registered owner is liable regardless of who drove. Not a defense by itself." },
  { id: "no-points", label: "\u201CThere are no points anyway\u201D",
    warning: "True that there are no DMV points and no insurance report — but that's a reason some people pay, not a legal defense." },
  { id: "parking-typo", label: "Wrong color / year / make typo",
    warning: "Those are § 238 PARKING-ticket defect grounds. They do not apply to camera tickets." },
  { id: "barely-over", label: "\u201CThe light was yellow / I was barely over\u201D",
    warning: "Without the City's own evidence failing, the video usually defeats this. Only the >10 mph margin (SZS) or a genuine signal/image problem (RLC) helps." },
];

export type CameraResult = {
  program: CameraProgram;
  grounds: CameraItem[];        // confirmed, in ranked order
  needProof: CameraItem[];      // confirmed grounds that need the user's evidence
  demandCity: CameraItem[];     // confirmed grounds that demand the City's proof
  traps: { id: string; label: string; warning: string }[]; // flagged losers
};

export function computeCameraResult(
  program: CameraProgram,
  confirmedIds: string[],
  trapIds: string[]
): CameraResult {
  const grounds = checklistFor(program).filter((i) => confirmedIds.includes(i.id));
  return {
    program,
    grounds,
    needProof: grounds.filter((g) => g.requiresProof),
    demandCity: grounds.filter((g) => g.requiresCityProof),
    traps: CAMERA_TRAPS.filter((t) => trapIds.includes(t.id)),
  };
}

// Neutral shape consumed by appeal.buildCameraLetter (kept out of appeal.ts to
// avoid a dependency cycle).
export type CameraLetterGround = {
  label: string;
  citation: string;
  why: string;
  requiresProof: boolean;
  requiresCityProof: boolean;
};

export function toCameraLetterGrounds(result: CameraResult): CameraLetterGround[] {
  return result.grounds.map((g) => ({
    label: g.label,
    citation: g.citation,
    why: g.why,
    requiresProof: g.requiresProof,
    requiresCityProof: g.requiresCityProof,
  }));
}
