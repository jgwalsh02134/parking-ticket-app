import { useState, useMemo } from "react";
import {
  Camera, ShieldCheck, TriangleAlert, Check, ArrowLeft, ArrowRight,
  ExternalLink, Scale, Info, Copy, Printer, Phone, HelpCircle,
} from "lucide-react";
import type { TicketForm } from "@/lib/appeal";
import { buildCameraLetter } from "@/lib/appeal";
import {
  checklistFor, computeCameraResult, toCameraLetterGrounds, CAMERA_TRAPS,
  type CameraProgram, type CameraTier,
} from "@/lib/cameraDefense";

const VIEWCITATION = "https://www.viewcitation.com";
const PHONE = "1-855-427-0455";

type Phase = "program" | "framing" | "walk" | "summary";

type Props = {
  form: TicketForm;
  onBack: () => void;
  onPrint: (text: string, title: string) => void;
};

const tierClass = (t: CameraTier) =>
  t === 1 ? "bg-accent/15 text-accent"
  : t === 2 ? "bg-[hsl(33_70%_40%/0.15)] text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]"
  : "bg-primary/10 text-primary";

export default function CameraDefense({ form, onBack, onPrint }: Props) {
  const [phase, setPhase] = useState<Phase>("program");
  const [program, setProgram] = useState<CameraProgram | null>(null);
  const [idx, setIdx] = useState(0);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const items = program ? checklistFor(program) : [];
  const result = useMemo(
    () => (program ? computeCameraResult(program, Object.keys(confirmed).filter((k) => confirmed[k]), []) : null),
    [program, confirmed]
  );
  const statement = useMemo(
    () => (program && result ? buildCameraLetter(form, toCameraLetterGrounds(result), program) : ""),
    [form, result, program]
  );

  const copyStatement = () => {
    if (navigator.clipboard && statement) navigator.clipboard.writeText(statement);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ---- Program picker ----------------------------------------------------
  if (phase === "program") {
    return (
      <div data-testid="camera-branch">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Camera size={20} /></span>
          <h2 className="text-xl font-semibold">Camera ticket — different rules</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Red-light and school-zone speed camera tickets are a different legal animal from parking tickets — the parking
          "ticket defect" grounds don't apply. Which kind is this?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: "rlc", title: "Red-light camera (RLC)", sub: "Entered an intersection against a red light" },
            { id: "szs", title: "School-zone speed camera (SZS)", sub: "Speeding in a school zone" },
          ] as const).map((o) => (
            <button key={o.id} onClick={() => { setProgram(o.id); setPhase("framing"); }} data-testid={`camera-program-${o.id}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-left transition hover-elevate">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-background text-primary"><Camera size={18} /></span>
              <div><div className="text-sm font-semibold">{o.title}</div><div className="text-xs text-muted-foreground">{o.sub}</div></div>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <button onClick={onBack} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
        </div>
      </div>
    );
  }

  // ---- Honest framing + evidence first -----------------------------------
  if (phase === "framing") {
    return (
      <div data-testid="camera-branch">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Camera size={20} /></span>
          <h2 className="text-xl font-semibold">Before you contest — the honest picture</h2>
        </div>
        <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          <ul className="space-y-1.5">
            <li>• This is <b className="text-foreground">civil owner-liability</b>: $50, <b className="text-foreground">no DMV points</b>, not reported to the State or your insurer.</li>
            <li>• The <b className="text-foreground">registered owner is liable regardless of who drove</b> — so "I wasn't driving" is not a defense by itself.</li>
            <li>• The City does not excuse these without a legal defense or evidence-backed explanation, and the video is usually clear. Wins come from a <b className="text-foreground">technical/procedural failure by the City</b> or a <b className="text-foreground">statutory affirmative defense</b>.</li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="text-sm font-semibold">Step 1 — review your evidence first</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Camera evidence is on viewcitation.com (NOT the parking portal). Enter your citation number + PIN from the notice and watch the photos/video, then come back and run the checklist.
          </p>
          <a href={VIEWCITATION} target="_blank" rel="noopener noreferrer" data-testid="link-viewcitation"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover-elevate">
            <ExternalLink size={15} /> Open viewcitation.com
          </a>
          <p className="mt-2 text-xs text-muted-foreground">Or by phone: {PHONE}. Appeal deadline: within <b>30 days</b> of issuance. Don't just pay — paying is an admission.</p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => { setProgram(null); setPhase("program"); }} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">← Back</button>
          <button onClick={() => { setIdx(0); setPhase("walk"); }} data-testid="camera-start-checklist"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            Run the checklist <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---- Checklist walk ----------------------------------------------------
  if (phase === "walk" && program) {
    const item = items[idx];
    const v = confirmed[item.id];
    const goNext = () => { if (idx + 1 < items.length) setIdx(idx + 1); else setPhase("summary"); };
    const goBack = () => { if (idx > 0) setIdx(idx - 1); else setPhase("framing"); };
    const set = (applies: boolean) => { setConfirmed((p) => ({ ...p, [item.id]: applies })); goNext(); };

    return (
      <div data-testid={program === "szs" ? "checklist-szs" : "checklist-rlc"}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{program === "szs" ? "School-zone speed" : "Red-light"} · ground {idx + 1} of {items.length}</span>
          <button onClick={() => setPhase("summary")} data-testid="camera-see-result" className="text-xs font-semibold text-primary hover:underline">See my result →</button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / items.length) * 100}%` }} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${tierClass(item.tier)}`}>Tier {item.tier}</span>
          {item.requiresCityProof && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Demand the City's proof</span>}
          {item.requiresProof && <span className="rounded-full bg-[hsl(33_70%_40%/0.15)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]">Needs your proof</span>}
        </div>
        <h3 className="mt-3 text-lg font-semibold">{item.label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">{item.citation}<ExternalLink size={11} /></a>

        <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm font-medium">{item.question}</div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button onClick={() => set(true)} data-testid="camera-verdict-yes"
            className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === true ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-secondary/30"}`}>
            <Check size={16} className="text-accent" /> Yes — raise this
          </button>
          <button onClick={() => set(false)} data-testid="camera-verdict-no"
            className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition hover-elevate ${v === false ? "border-border bg-secondary ring-1 ring-border" : "border-border bg-secondary/30"}`}>
            <HelpCircle size={16} className="text-muted-foreground" /> No / doesn't apply
          </button>
          <button onClick={goNext} data-testid="camera-verdict-skip"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-left text-sm transition hover-elevate">
            <ArrowRight size={16} className="text-muted-foreground" /> Not sure — skip
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={goBack} className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><ArrowLeft size={16} /> Back</button>
          <button onClick={goNext} data-testid="camera-next" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate">
            {idx + 1 < items.length ? "Next" : "See my result"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ---- Summary -----------------------------------------------------------
  return (
    <div data-testid="summary-camera-defense">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><ShieldCheck size={20} /></span>
        <h2 className="text-xl font-semibold">Your camera-ticket result</h2>
      </div>

      {result && result.grounds.length > 0 ? (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4" data-testid="camera-result-grounds">
          <div className="text-sm font-semibold">Grounds to raise — lead with {result.grounds.length > 1 ? "these" : "this"}:</div>
          <ul className="mt-2 space-y-2">
            {result.grounds.map((g) => (
              <li key={g.id} className="text-sm">
                <div className="font-semibold">{g.label} {g.requiresCityProof && <span className="text-xs font-normal text-primary">— demand the City's records</span>}{g.requiresProof && <span className="text-xs font-normal text-[hsl(33_70%_36%)] dark:text-[hsl(33_70%_62%)]"> — bring your proof</span>}</div>
                <a href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">{g.citation}<ExternalLink size={11} /></a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground" data-testid="camera-result-none">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>No solid ground confirmed yet. You can still contest and put the City to its proof — but be candid with yourself: without a technical/procedural failure or a statutory affirmative defense, the video usually carries the day. Re-check the items, especially the speed margin (SZS) or image clarity (RLC), and demand the City's logs/certificate/images.</div>
        </div>
      )}

      {result && result.needProof.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4" data-testid="camera-result-proof">
          <div className="text-sm font-semibold">Need proof — bring this:</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {result.needProof.map((g) => <li key={g.id}>• {g.label}</li>)}
          </ul>
        </div>
      )}

      {/* Won't work */}
      <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
        <div className="text-sm font-semibold">Won't work — don't build on these:</div>
        <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          {CAMERA_TRAPS.map((t) => <li key={t.id}><b className="text-foreground">{t.label}:</b> {t.warning}</li>)}
        </ul>
      </div>

      {/* Generated statement */}
      <h3 className="mt-6 mb-2 text-sm font-semibold">Your statement for the pre-trial conference</h3>
      <div className="max-h-[360px] overflow-auto rounded-xl border border-border bg-secondary/30 p-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap" data-testid="camera-statement">{statement}</div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
        <Scale size={14} className="mt-0.5 shrink-0 text-primary" />
        <div>Grounds and citations come only from the app's verified camera-defense source. For demand-proof items the statement puts the burden on the City — it never asserts a defect you can't substantiate.</div>
      </div>

      {/* Channel + actions */}
      <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-5">
        <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Camera size={18} /> Contest it (camera channel)</h4>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Camera tickets are appealed through <b>viewcitation.com</b> or by phone — not the parking email. Appeal within <b>30 days</b> of issuance; late appeals aren't accepted. Bring this statement to your pre-trial conference at the PVB (24 Eagle St, Rm 203).
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={VIEWCITATION} target="_blank" rel="noopener noreferrer" data-testid="link-viewcitation"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover-elevate"><ExternalLink size={16} /> Open viewcitation.com</a>
          <a href={`tel:${PHONE.replace(/-/g, "")}`} data-testid="camera-phone"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Phone size={16} /> Call {PHONE}</a>
          <button onClick={() => onPrint(statement, `Camera Ticket Statement — ${form.ticket || ""}`)} data-testid="camera-print"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Printer size={16} /> Save as PDF / print</button>
          <button onClick={copyStatement} data-testid="camera-copy"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover-elevate"><Copy size={16} /> {copied ? "Copied!" : "Copy statement"}</button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => setPhase("walk")} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate"><ArrowLeft size={16} className="inline" /> Re-check</button>
        <button onClick={onBack} className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold hover-elevate">Back to start</button>
      </div>
    </div>
  );
}
