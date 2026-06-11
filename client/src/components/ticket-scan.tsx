import { useState, useMemo, useEffect } from "react";
import {
  ScanLine, ShieldCheck, TriangleAlert, Check, X, ArrowLeft, ArrowRight,
  Scale, ExternalLink, Info, HelpCircle,
} from "lucide-react";
import type { TicketForm } from "@/lib/appeal";
import {
  TIER1_FIELDS, TIER2_GROUNDS, TIER3_TRAPS, visibleTier1Fields,
  computeScanResult, type Verdict, type ScanContext, type ScanResult, type ScanField,
} from "@/lib/ticketScan";

type Phase = "intro" | "tier1" | "tier2" | "tier3" | "summary";
type ProceedMode = "dismissal" | "demand" | "situation";

type Props = {
  form: TicketForm;
  scanValues: Record<string, string>;
  daysLeft: number | null;
  deadlineDays: number;
  onResult: (r: ScanResult) => void;
  onProceed: (mode: ProceedMode) => void;
  onProvideValue: (field: ScanField, value: string) => void;
};

const inputCls = "w-full rounded-md border border-input bg-secondary/40 px-3 py-2.5 text-sm";

export default function TicketScan({ form, scanValues, daysLeft, deadlineDays, onResult, onProceed, onProvideValue }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [ctx, setCtx] = useState<ScanContext>({ isExpiredMeter: false, isPostedSign: false });
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [tier2Ids, setTier2Ids] = useState<string[]>([]);
  const [tier3Ids, setTier3Ids] = useState<string[]>([]);

  const fields = useMemo(() => visibleTier1Fields(ctx), [ctx]);
  const result = useMemo(
    () => computeScanResult(verdicts, tier2Ids, tier3Ids, ctx),
    [verdicts, tier2Ids, tier3Ids, ctx]
  );
  useEffect(() => { onResult(result); }, [result, onResult]);

  const setVerdict = (id: string, v: Verdict) => setVerdicts((p) => ({ ...p, [id]: v }));
  const toggle = (arr: string[], set: (a: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const deadlineNear = daysLeft != null && daysLeft <= 7;

  // ---- Intro -------------------------------------------------------------
  if (phase === "intro") {
    return (
      <div data-testid="scan-intro">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><ScanLine size={20} /></span>
          <h2 className="text-xl font-semibold">Scan your ticket for a dismissal</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          The strongest way to beat a parking ticket is a defect on the ticket itself. New York law (VTL § 238(2-a)(b))
          requires the Bureau to <b>dismiss</b> a ticket if any required field is omitted, misdescribed, or illegible.
          We'll check the required fields one at a time, in order of how often they win. We only flag what you can
          actually see on your ticket — we never guess.
        </p>

        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="mb-2 text-sm font-semibold">Two quick questions so we ask the right fields</div>
          <label className="flex items-start gap-2 py-1.5 text-sm">
            <input type="checkbox" checked={ctx.isExpiredMeter} data-testid="scan-ctx-meter"
              onChange={(e) => setCtx((c) => ({ ...c, isExpiredMeter: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
            <span>This ticket is for an <b>expired meter</b> (so the meter number is a required field).</span>
          </label>
          <label className="flex items-start gap-2 py-1.5 text-sm">
            <input type="checkbox" checked={ctx.isPostedSign} data-testid="scan-ctx-sign"
              onChange={(e) => setCtx((c) => ({ ...c, isPostedSign: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]" />
            <span>This is a <b>posted-sign</b> violation — no-parking, street-cleaning, or a time-limited zone (so the days/hours in effect are required).</span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => onProceed("situation")} data-testid="scan-skip-to-situation"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Skip — use the situation picker instead
          </button>
          <button onClick={() => { setPhase("tier1"); setIdx(0); }} data-testid="scan-start"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            Start the scan <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---- Tier 1 walk -------------------------------------------------------
  if (phase === "tier1") {
    const field = fields[idx];
    const printed = (field.formField ? (form[field.formField] as string) : "") || scanValues[field.id] || "";
    const v = verdicts[field.id];
    const missingOnly = field.conditional === "missing-only";
    const goNext = () => { if (idx + 1 < fields.length) setIdx(idx + 1); else setPhase("tier2"); };
    const goBack = () => { if (idx > 0) setIdx(idx - 1); else setPhase("intro"); };

    return (
      <div data-testid="scan-tier1">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Required field {idx + 1} of {fields.length}</span>
          <button onClick={() => setPhase("summary")} data-testid="scan-see-result"
            className="text-xs font-semibold text-primary hover:underline">See my result →</button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / fields.length) * 100}%` }} />
        </div>

        <h3 className="mt-5 text-lg font-semibold">{field.label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{field.why}</p>

        <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">On your record it says</span>
          {printed ? (
            <div className="mt-1 font-mono font-semibold" data-testid="scan-printed-value">{printed}</div>
          ) : (
            <div className="mt-1" data-testid="scan-printed-value">
              <span className="text-muted-foreground">Not shown on the record you pulled.</span>
              <input
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value=""
                onChange={(e) => onProvideValue(field, e.target.value)}
                placeholder={`If you know the ${field.label.toLowerCase()}, type it here (optional)`}
                data-testid="scan-provide-value"
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave blank to make the City produce it — don't guess.</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm font-semibold">Is this correct on your ticket?</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button onClick={() => { setVerdict(field.id, "ok"); goNext(); }} data-testid="scan-verdict-ok"
            className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === "ok" ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-secondary/30"}`}>
            <Check size={16} className="text-accent" /> Yes — it's correct
          </button>
          {!missingOnly && (
            <>
              <button onClick={() => setVerdict(field.id, "misdescribed")} data-testid="scan-verdict-misdescribed"
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === "misdescribed" ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                <TriangleAlert size={16} className="text-primary" /> It's wrong / doesn't match
              </button>
              <button onClick={() => setVerdict(field.id, "omitted")} data-testid="scan-verdict-omitted"
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === "omitted" ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                <TriangleAlert size={16} className="text-primary" /> It's missing / blank
              </button>
              <button onClick={() => setVerdict(field.id, "illegible")} data-testid="scan-verdict-illegible"
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === "illegible" ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                <TriangleAlert size={16} className="text-primary" /> It's unreadable
              </button>
            </>
          )}
          {missingOnly && (
            <button onClick={() => setVerdict(field.id, "omitted")} data-testid="scan-verdict-omitted"
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === "omitted" ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
              <TriangleAlert size={16} className="text-primary" /> It's completely missing
            </button>
          )}
          <button onClick={() => { setVerdict(field.id, "unknown"); goNext(); }} data-testid="scan-verdict-unknown"
            className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === "unknown" ? "border-border bg-secondary ring-1 ring-border" : "border-border bg-secondary/30"}`}>
            <HelpCircle size={16} className="text-muted-foreground" /> {printed ? "Can't tell" : "Not shown — make the City produce it"}
          </button>
        </div>

        {v && v !== "ok" && v !== "unknown" && (
          <div className="mt-4 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent" data-testid="scan-field-hit">
            <b>That's a dismissal ground.</b> A defect in the {field.label.toLowerCase()} triggers mandatory dismissal under § 238(2-a)(b). Keep going to check for more, or jump to your result.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={goBack} className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={goNext} data-testid="scan-next"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            {idx + 1 < fields.length ? "Next field" : "Check other grounds"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---- Tier 2 ------------------------------------------------------------
  if (phase === "tier2") {
    return (
      <div data-testid="scan-tier2">
        <h3 className="text-lg font-semibold">Other grounds to check</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          These can win, but they depend on evidence or your circumstances. Flag any that apply — we'll note the proof each one needs.
        </p>
        <div className="space-y-2.5">
          {TIER2_GROUNDS.map((g) => {
            const on = tier2Ids.includes(g.id);
            return (
              <button key={g.id} onClick={() => toggle(tier2Ids, setTier2Ids, g.id)} data-testid={`scan-tier2-${g.id}`}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition hover-elevate ${on ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/30"}`}>
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                  {on && <Check size={13} />}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{g.question}</div>
                  <div className="text-xs leading-snug text-muted-foreground">{g.label} — {g.citation}</div>
                  {on && <div className="mt-1.5 text-xs text-primary"><b>Proof needed:</b> {g.proofNeeded}</div>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => { setPhase("tier1"); setIdx(fields.length - 1); }} className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => setPhase("tier3")} data-testid="scan-tier2-next"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---- Tier 3 ------------------------------------------------------------
  if (phase === "tier3") {
    return (
      <div data-testid="scan-tier3">
        <h3 className="text-lg font-semibold">A quick reality check</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          People often think these win — but under New York's substantial-compliance rule they usually <b>don't</b>.
          Check any you were planning to argue so we can warn you before you file.
        </p>
        <div className="space-y-2.5">
          {TIER3_TRAPS.map((t) => {
            const on = tier3Ids.includes(t.id);
            return (
              <button key={t.id} onClick={() => toggle(tier3Ids, setTier3Ids, t.id)} data-testid={`scan-tier3-${t.id}`}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition hover-elevate ${on ? "border-destructive bg-destructive/10 ring-1 ring-destructive" : "border-border bg-secondary/30"}`}>
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? "border-destructive bg-destructive text-destructive-foreground" : "border-border bg-background"}`}>
                  {on && <Check size={13} />}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{t.label}</div>
                  {on && <div className="mt-1.5 text-xs text-destructive">{t.warning}</div>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setPhase("tier2")} className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => setPhase("summary")} data-testid="scan-tier3-next"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            See my result <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---- Summary -----------------------------------------------------------
  const Badge = ({ tier }: { tier: 1 | 2 | 3 }) => {
    const map = {
      1: "bg-accent/15 text-accent",
      2: "bg-[hsl(33_70%_40%/0.15)] text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]",
      3: "bg-destructive/15 text-destructive",
    } as const;
    const label = { 1: "T1 · Mandatory dismissal", 2: "T2 · Needs proof", 3: "T3 · Won't work alone" } as const;
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${map[tier]}`}>{label[tier]}</span>;
  };

  return (
    <div data-testid="scan-summary">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><ShieldCheck size={20} /></span>
        <h2 className="text-xl font-semibold">Your scan result</h2>
      </div>

      {/* Dismissal grounds (T1) */}
      {result.tier1.length > 0 && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4" data-testid="scan-result-dismissal">
          <div className="mb-2 flex items-center gap-2"><Badge tier={1} /></div>
          <div className="text-sm font-semibold">Dismissal grounds found — lead with {result.tier1.length > 1 ? "these" : "this"}:</div>
          <ul className="mt-2 space-y-2">
            {result.tier1.map(({ field }) => (
              <li key={field.id} className="text-sm">
                <div className="font-semibold">{field.label}</div>
                <a href={field.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {field.citation} <ExternalLink size={11} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Needs-proof (T2) */}
      {result.tier2.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4" data-testid="scan-result-tier2">
          <div className="mb-2 flex items-center gap-2"><Badge tier={2} /></div>
          <div className="text-sm font-semibold">Needs proof — bring the evidence below:</div>
          <ul className="mt-2 space-y-2">
            {result.tier2.map((g) => (
              <li key={g.id} className="text-sm">
                <div className="font-semibold">{g.label}</div>
                <div className="text-xs text-muted-foreground">{g.citation} · <b>Proof:</b> {g.proofNeeded}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Won't-work (T3) */}
      {result.tier3.length > 0 && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4" data-testid="scan-result-tier3">
          <div className="mb-2 flex items-center gap-2"><Badge tier={3} /></div>
          <div className="text-sm font-semibold">Won't work — don't file these alone:</div>
          <ul className="mt-2 space-y-2">
            {result.tier3.map((t) => (
              <li key={t.id} className="text-sm"><div className="font-semibold">{t.label}</div><div className="text-xs text-muted-foreground">{t.warning}</div></li>
            ))}
          </ul>
        </div>
      )}

      {/* Nothing confirmed */}
      {!result.hasAnyGround && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground" data-testid="scan-result-none">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>
            No self-proving defect confirmed yet{result.unknown.length ? `, and ${result.unknown.length} field${result.unknown.length > 1 ? "s were" : " was"} marked "can't tell."` : "."}{" "}
            {deadlineNear
              ? `Your appeal is due in about ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Don't wait on records — file a not-guilty plea now and make the City produce the ticket and prove every element. You can run this scan again on what they produce.`
              : `You can file a not-guilty plea and demand the City prove the charge, or use the situation picker to build a different defense.`}
          </div>
        </div>
      )}

      {/* Legal-basis note */}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
        <Scale size={14} className="mt-0.5 shrink-0 text-primary" />
        <div>Grounds and citations come only from the app's verified legal source. We only assert a defect you confirmed from your own ticket — never a guess.</div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {result.hasAnyGround ? (
          <button onClick={() => onProceed("dismissal")} data-testid="scan-proceed-dismissal"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            Build my appeal around {result.hasDismissalGround ? "this dismissal ground" : "these grounds"} <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={() => onProceed("demand")} data-testid="scan-proceed-demand"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            File on time &amp; demand the City's proof <ArrowRight size={16} />
          </button>
        )}
        <button onClick={() => onProceed("situation")} data-testid="scan-proceed-situation"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate">
          Use the situation picker instead
        </button>
        <button onClick={() => { setPhase("tier1"); setIdx(0); }} data-testid="scan-restart"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate">
          <ArrowLeft size={16} /> Re-scan
        </button>
      </div>
    </div>
  );
}
