# Verified Legal Foundation — All NYS Grounds to Dismiss a Parking Ticket

**PURPOSE.** This is the single source of truth for every legal basis the app may use to argue a City of Albany parking ticket should be dismissed. EVERY item below is sourced to a primary legal source: the NY Vehicle & Traffic Law (VTL) itself or NY Court of Appeals decisions.

**HARD RULE FOR ANY CODE/AI BUILT ON THIS:** Cite ONLY what appears here. Do NOT invent or add a statute, case, subdivision, or citation. If you believe another authority is needed, output it as `// TODO(verify)` for a human to confirm against a primary source — never assert it as law. Never claim a ground applies unless the user has confirmed the underlying fact from their own ticket/records.

**SCOPE.** VTL Article 2-B (§§ 235–241) governs municipal administrative parking adjudication — i.e. the City of Albany Parking Violations Bureau (PVB). It does NOT govern red-light / school-zone speed CAMERA tickets, which run under VTL § 1111-a (red light) and § 1180-f (school-zone speed) and are appealed via viewcitation.com. See Category F below. Do not apply the parking grounds to camera tickets.

---

## CATEGORY A — Defects on the face of the ticket (strongest, self-proving)

### A1. The 10 required contents — VTL § 238(2)

A notice of parking violation must contain (NY VTL § 238):

1. Name of person charged (or "owner of the vehicle bearing license" + plate, if owner not present)
2. Plate designation (plate number)
3. Plate type
4. Expiration date (of registration)
5. Make or model
6. Body type
7. Description of the charged violation, incl. reference to the applicable rule/provision
8. Days and hours the rule is in effect (or "ALL" for every day / 24 hours)
9. Meter number for a meter violation, where appropriate
10. Date, time, and particular place of occurrence (a bare meter number is NOT a sufficient place description)

### A2. The dismissal trigger — VTL § 238(2-a)(b) ← MOST POWERFUL

"If any information which is required to be inserted on a notice of violation is omitted from the notice of violation, misdescribed, or illegible, the violation shall be dismissed upon application of the person charged with the violation."

Mandatory dismissal — applies to ANY of the 10 required fields. Three triggers: omitted, misdescribed, illegible.

### A3. The five MANDATORY ID elements — Court of Appeals

The five identification elements are mandatory; defect in any one = dismissal: plate designation · plate type · expiration date · make/model · body type.

- Omission → dismissal: Matter of Ryder Truck Rental, Inc. v. Parking Violations Bureau, 62 N.Y.2d 667 (1984).
- Misdescription → dismissal, no "small error" exception: Matter of Wheels, Inc. v. Parking Violations Bureau, 80 N.Y.2d 1014 (1992) — "a misdescription of any of the five mandatory identification elements also mandates dismissal."

### A4. The blank-field carve-out — VTL § 238(2-a)(a)

Plate type or expiration date MAY be lawfully omitted ONLY if the plate/sticker doesn't show them or is "covered, faded, defaced or mutilated so that it is unreadable" — and that condition is itself described and inserted on the ticket. A blank plate-type/expiration field with NO such explanation = defect.

---

## CATEGORY B — Evidentiary / burden-of-proof grounds

### B1. Substantial-evidence standard — VTL § 240.2(b) ← CORE

"No charge may be established except upon proof by substantial evidence." The City carries the burden. If the City cannot produce substantial evidence of the violation, it cannot be sustained. This is the legal hook behind proof-of-payment, broken-meter, and "the facts are wrong" defenses: a time-stamped receipt or contrary fact rebuts the City's evidence.

### B2. Right to subpoena the issuing officer & records — VTL § 240.2(d)

The hearing examiner shall, on request and a showing of good cause (or sua sponte), "issue a subpoena to compel the appearance … of the officer who served the notice of violation" and a subpoena duces tecum for "any book, paper or other thing relevant to the charges." → Practical use: combine with the app's FOIL flow to demand the officer's notes, photos, meter logs, and sign records that the City must otherwise produce.

### B3. Hearing examiner may NOT use prior record before deciding — § 240.2(f)

"The hearing examiner shall not examine the prior violation record of a person charged before making a determination."

### B4. A record must be made of a contested hearing — § 240.2(g)

---

## CATEGORY C — Owner-liability / "not my responsibility" defenses (VTL § 239)

### C1. Stolen vehicle — VTL § 239(3) ← clean, statutory defense

"it shall be a valid defense to any charge of a parking violation that the motor vehicle had been reported to the police as stolen prior to the time the violation occurred and had not been recovered by such time. … it shall be sufficient that a certified copy of the police report of the stolen vehicle be mailed to the bureau."

### C2. Rented/leased vehicle — lessor passes liability to lessee — § 239(2)(b)

A lessor is not liable if it pre-filed the plate + paid the filing fee AND, within 37 days of notice, gives the bureau the lessee's correct name/address. → Relevant when the cited party is a rental company OR when a renter is wrongly billed as owner.

### C3. Operator vs. owner — § 239(2)(a)

The operator is liable; the owner is jointly liable only if the vehicle was used "with the permission of the owner, express or implied." Identity disputes ("wasn't my car / wasn't me driving / I sold it") attack this permission/ownership link.

**NOTE:** § 239 does not state a stand-alone "I sold the car" affidavit procedure; a sold-vehicle argument rests on the ownership definition + lack of permission, backed by the bill of sale / transfer record. Frame it as an evidentiary ownership challenge under § 239(2)(a) + § 240.2(b), not as a named statutory safe-harbor.

---

## CATEGORY D — Procedural / timing grounds

### D1. Two-year absolute bar on default judgment — VTL § 241(2) ← hard deadline

"In no case shall a default judgment be rendered or, where required, a notice of impending default judgment be sent, more than two years after the expiration of the time prescribed for entering a plea or contesting an allegation."

### D2. Notice + 30 days before any default — § 241(2)

Before a default judgment, the bureau must mail (first class) a notice stating the charge, the impending default, where judgment enters, and that default is avoidable by responding "within thirty days of the sending of such notice." (Exception: non-residents need not receive this notice.)

### D3. No fine before the demanded hearing — §§ 240.1-a, 241(2)

"When a person has demanded a hearing, no fine or penalty shall be imposed for any reason, prior to the holding of the hearing." (§ 241(2)) "the bureau shall not issue any notice of fine or penalty to that person prior to the date of the hearing." (§ 240.1-a)

### D4. No greater penalty than originally charged — § 241(2)

If the examiner sustains the charge, "he or she shall impose no greater penalty or fine than those upon which the person was originally charged."

### D5. Right to a hearing on a not-guilty plea — § 240.1

On a not-guilty plea, the bureau must mail the hearing date; failure to appear = admission of liability + possible default.

---

## CATEGORY E — Substantive defenses (must be backed by evidence under § 240.2(b))

These are not automatic; they win by rebutting the City's "substantial evidence":

- **Proof of payment** (meter/Park Albany receipt, card statement) — rebuts a non-payment/overtime charge under § 240.2(b).
- **Broken meter** — meter malfunction defeats a payment-required charge; pair with a § 240.2(d) subpoena / FOIL for the meter maintenance log.
- **Missing/obscured/conflicting sign** — if the regulation wasn't validly posted, the "particular place"/applicable-rule elements (§ 238(2) items 7, 8, 10) and the substantial-evidence requirement (§ 240.2(b)) are in play; FOIL the sign installation/maintenance records.
- **Wrong facts (date/time/location)** — a misdescribed required field under § 238(2-a)(b), and/or a substantial-evidence failure under § 240.2(b).

---

## CATEGORY F — CAMERA tickets are different (do NOT use the above)

Red-light (VTL § 1111-a) and school-zone speed (VTL § 1180-f) camera "notices of liability" are expressly excluded from the § 238/239 parking framework (see the "Notice of violation" definition in § 239(1), and § 239(4) applicability). Camera-ticket defenses are their own thing (e.g. the technician's affirmed certificate / device calibration under § 1180-f). In the app, camera tickets (the RLC/SZS checkbox) must route to viewcitation.com / 1-855-427-0455 — the Ticket Error Scan and the § 238 grounds must NOT run on them.

---

## Albany procedure & deadlines (re-confirmed, albanyny.gov/403)

- Parking plea/payment within 20 days of violation; RLC/SZS within 30 days.
- Appeal parking by mail, in person, or email parkingticketappeal@albanyny.gov.
- Camera appeals only via viewcitation.com or 1-855-427-0455.
- PVB: City Hall, 24 Eagle St Rm 203, Albany NY 12207; 518-434-5006; open 8:30–4:45 (closed 12:30–1:30).
- Do not pay first — paying = pleading guilty.

## How to raise these (practical)

A parking defect/defense is raised "upon application of the person charged" (§ 238(2-a)(b)) — i.e. in the Albany appeal letter (email/mail/in person), or at the hearing after a not-guilty plea. The letter should state the specific ground, identify the exact field/fact at issue, cite the provision from this doc, and (for evidentiary defenses) attach or FOIL the supporting proof.

---

# RANKED COMMON-ERRORS CHECKLIST — "CHECK THESE FIRST"

This is the priority order the app should scan an Albany parking ticket for. Errors are ranked by win-probability (highest first). Every Tier-1 item is a self-proving defect on the user's own ticket — no portal access, no guessing, no fabrication needed. The defect either is or is not printed on the citation the user is holding.

### Confidence tags

- **[T1 — STATUTORY MANDATORY DISMISSAL]** — VTL § 238(2-a)(b) requires dismissal "upon application." Strongest. Scan these first.
- **[T2 — EVIDENCE-DEPENDENT]** — wins only if the City fails its § 240.2(b) substantial-evidence burden, or via a § 239 affirmative defense with proof.
- **[T3 — COMMONLY CLAIMED BUT NOT DISMISSIBLE]** — frequently believed to be fatal but are NOT, under the substantial-compliance doctrine. The app must tell users these will FAIL, to avoid filing a losing appeal.

## TIER 1 — Required-field defects (scan first; mandatory dismissal)

Authority: VTL § 238(2) (the 10 required contents) + § 238(2-a)(b) (omission / misdescription / illegibility of any required item = dismissal on application), as applied in Ryder Truck (omission) and Wheels (misdescription, no small-error exception). The NYC Dept. of Finance "Required elements in a ticket" page confirms which fields the adjudicating agency treats as required.

### The FIVE vehicle-identification elements — a defect in ANY one is dismissible

1. **Plate number** — wrong/missing/illegible plate designation. (Highest-value: misidentifies the vehicle entirely.) [T1]
2. **Plate type** — e.g. PAS / OMT / COM / APPORTIONED wrong or blank without the § 238(2-a)(a) "unreadable, described on ticket" exception. [T1]
3. **Registration expiration date** — wrong or blank (same exception applies). [T1]
4. **Make** — wrong manufacturer (e.g. ticket says Toyota, car is Honda). [T1]
5. **Body type** — wrong body class (e.g. SUBN vs 4DSD vs MCY). Wheels confirms a misdescribed body type alone is dismissible. [T1]

### Other required § 238(2) contents — defect = dismissible

6. **State of registration** — wrong/missing issuing state. [T1]
7. **Date of violation** — missing, illegible, or impossible date. [T1]
8. **Time of violation** — missing, illegible, or missing a.m./p.m. designation. [T1]
9. **Place / location of violation** — missing or so vague it cannot identify where the car was. (Must be specific enough to locate.) [T1]
10. **Violation charged** — missing code OR missing the plain-English description the code requires. [T1]
11. **Meter number** — ONLY for expired-meter (muni-meter) charges. Required when the charge is expired meter; NOT required for "failure to display" muni-meter receipt charges. Apply only to the matching violation code. [T1, conditional]
12. **Officer / issuer identification** (badge/shield or signature). Note: per NYC DOF, the issuer's signature need not be legible — so "illegible signature" alone is NOT a winner; a fully MISSING officer ID is. [T1, narrow]
13. **"Days/hours in effect" for posted-sign violations** — for no-parking / street-cleaning / time-limited zones, the restricted days & hours that were in effect are a required element; omission is dismissible. [T1]

**App behavior:** if the user reports ANY Tier-1 field as wrong, missing, or unreadable on their physical ticket, surface the § 238(2-a)(b) mandatory-dismissal argument as the PRIMARY defense and cite the exact provision.

## TIER 2 — Evidence & affirmative-defense grounds (scan second)

1. **City's substantial-evidence failure** — § 240.2(b): no charge may be established except by substantial evidence; burden is on the City. If the officer's notes/photos are thin or contradictory, demand proof and subpoena the officer & records (§ 240.2(d)). [T2]
2. **Signage actually absent / obscured / contradictory** — user states the posted sign was missing, knocked down, or conflicting. Best supported by a dated photo. [T2 — needs proof]
3. **Stolen vehicle** — § 239(3): certified police report of theft is a complete defense. [T2 — needs proof]
4. **Lease / rental — wrong party** — § 239(2)(b): liability transfers to the lessee; lessor can be dismissed with the lease/rental agreement. [T2 — needs proof]
5. **Default-judgment / staleness bars** — § 241(2): 2-year absolute bar on entering default; 30-day notice required before default; no greater penalty than originally charged. [T2 — date-dependent]

## TIER 3 — DO NOT FILE THESE ALONE (commonly claimed, NOT dismissible)

Substantial-compliance doctrine — the ticket is valid if it reasonably identifies the vehicle/violation despite minor errors. NYC DOF states outright it is "not a valid defense that the vehicle color or year is incorrect."

1. **Wrong vehicle COLOR** — color is NOT a required § 238(2) element. NOT a defense. [T3]
2. **Wrong vehicle YEAR / model year** — NOT a defense. [T3]
3. **Slight misspelling of make/model** that still identifies the car (e.g. "Chevy" vs "Chevrolet") — substantial compliance; NOT a defense. [T3]
4. **Minor address abbreviation / formatting** where the place is still identifiable — NOT a defense. [T3]
5. **Illegible officer signature** (signature present but messy) — per NYC DOF the signature need not be legible; NOT a defense. [T3]

**App behavior:** if the user's only complaint is a Tier-3 item, the app must clearly warn that this will almost certainly LOSE and steer them to a Tier-1/Tier-2 ground or a non-error defense — never generate a confident appeal on a Tier-3 ground alone.

## Scan algorithm for the app (plain English)

1. If ticket is RLC/SZS camera → skip this entire scan (Category F).
2. Walk Tier 1 fields in order 1→13. For each, ask the user to confirm the printed value against their actual vehicle/situation. First confirmed defect = primary argument under § 238(2-a)(b).
3. If no Tier-1 defect, evaluate Tier 2 (ask about signage, theft, lease, ticket age) — flag any that apply and note required proof.
4. Cross-check Tier 3: if the user flagged a color/year/spelling issue, mark it NON-dismissible and do not build the appeal on it.
5. Cite ONLY provisions in this document. Never invent a statute, case, or fact.

## DISMISSAL-FIRST STRATEGY (the app's core logic)

The app's goal is dismissal, not just "an appeal." It works in this order:

1. **Read how the ticket was written.** Take every field the user can give (photo/OCR if they have the ticket; portal basics — plate, code, date — if they don't) and scan for the Tier-1 required-field defects that trigger mandatory dismissal under VTL § 238(2-a)(b).
2. **Look for the dismissal indicator.** Walk the Tier-1 list in win-probability order (plate # → plate type → reg expiration → make → body type → state → date → time/am-pm → place → code+description → meter# [expired-meter only] → officer ID [missing only] → days/hours). The FIRST confirmed defect is the dismissal hook.
3. **Formulate the appeal AROUND that defect.** The letter is built from how the ticket was actually written: lead with the specific defective field, cite § 238(2-a)(b) + Ryder/Wheels, and demand dismissal "upon application."
4. **Only if no Tier-1 defect exists,** fall back to Tier-2 (substantial-evidence demand § 240.2(b), signage, stolen § 239(3), lease § 239(2)(b), staleness § 241(2)). Never lead with Tier-3 (color/year/spelling) — flag those as losers.

### Deadline rule (overrides FOIL)

The Albany appeal window is short (20 days, parking). Filing on time beats waiting for records. FOIL is too slow to rely on inside the window. If the user has no physical ticket and the deadline is near:

- File the contest NOW from portal basics + the user's own facts, AND
- Demand the City produce the citation and prove every required element by substantial evidence (§ 240.2(b)) with the right to inspect the officer's record (§ 240.2(d)).
- The burden is on the City. When they produce the ticket (at/before the hearing), run the Tier-1 dismissal scan against THEIR produced record — no FOIL wait, no guessing. FOIL may run in parallel but must never block timely filing.

### No-fabrication guardrail

The app may only assert a defect it can actually see (on the user's photo/OCR or on a record the City produced). When fields are unknown, it does NOT guess them — it files on time and demands the City produce them. This keeps every dismissal argument true and self-proving.
