import { Shield, ArrowLeft, Lock, Server, EyeOff, ExternalLink } from "lucide-react";

// Privacy page — every statement here is written to match the app's actual
// code (client/src/pages/home.tsx + server/routes.ts). If the data flow
// changes, update this page too.
export default function Privacy() {
  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="mt-8">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
          <span className="text-primary"><Shield size={24} /></span>
          <div className="font-semibold leading-none tracking-tight">Albany Ticket Appeal — Privacy</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <a href="#/" data-testid="link-privacy-back"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to the app
        </a>

        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">How we handle your data</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This is a free tool that helps City of Albany residents prepare a parking-ticket appeal. It's built to keep
          your information on your own device wherever possible. This page explains, plainly, what stays in your
          browser and the few cases where information is sent to a server.
        </p>

        <Section icon={<Lock size={18} />} title="What stays in your browser">
          <p>
            Your appeal letter is generated entirely in your browser. The ticket details and contact information you
            type (name, email, mailing address, phone, ticket number, plate, and your description of what happened)
            are used on your device to build the letter.
          </p>
          <p>
            To let you finish later, your in-progress answers are saved in your browser's local storage. They never
            leave your device, and you can erase them at any time with the <b>“Start over”</b> button. (In some
            embedded/preview contexts the browser blocks local storage; if so, nothing is saved and the feature simply
            turns off.)
          </p>
          <p>
            When you choose <b>“Open in your email app,”</b> the letter is handed to your own email program with the
            text pre-filled — we don't send the email and don't receive a copy. Note your email app can't attach files
            for you, so add any evidence yourself.
          </p>
        </Section>

        <Section icon={<Server size={18} />} title="What is sent to a server, and when">
          <p>These optional features are the only ones that send your content off your device. Each is something you choose to use:</p>
          <ul className="mt-1 list-disc space-y-2 pl-5">
            <li>
              <b>Photo reader (auto-fill from a ticket photo):</b> if you upload a photo, the image is sent to our
              server and on to an AI vision provider (OpenAI) to read the fields. If the server isn't configured with a
              key, this feature is unavailable and no image is sent.
            </li>
            <li>
              <b>“Match my situation”:</b> the description you type is sent to our server and on to an AI provider (xAI)
              to suggest which situation fits. It only classifies — it never writes legal content.
            </li>
            <li>
              <b>“Polish my letter”:</b> the letter text — which includes the contact details and ticket facts you
              entered — is sent to our server and on to an AI provider (xAI) to improve wording only. You can revert to
              your original at any time.
            </li>
            <li>
              <b>“Submit” a FOIL request:</b> your ticket number, name, and email are sent to our server and recorded in
              its activity logs so there's a record of the attempt; the request itself is completed through your email
              app or the City's portal.
            </li>
          </ul>
          <p>
            AI processing (OpenAI, xAI) only happens for the features above and only when the server is configured for
            it. If it isn't, those buttons tell you so and the rest of the app works normally.
          </p>
        </Section>

        <Section icon={<EyeOff size={18} />} title="What we don't do">
          <ul className="list-disc space-y-2 pl-5">
            <li>We don't store your name, contact details, or ticket data in a database.</li>
            <li>We don't sell or rent your information to anyone.</li>
            <li>We don't use advertising trackers or marketing cookies. Light/dark theme follows your system setting.</li>
            <li>
              The “Check my open parking tickets” feature is a guided hand-off: you enter your plate here only to copy
              it, then search on the City's official portal yourself. We don't submit it for you or store it.
            </li>
          </ul>
        </Section>

        <Section icon={<ExternalLink size={18} />} title="Third parties & official sources">
          <p>
            AI features, when enabled, are processed by <a className="text-primary underline decoration-dotted" href="https://openai.com" target="_blank" rel="noopener noreferrer">OpenAI</a> and
            {" "}<a className="text-primary underline decoration-dotted" href="https://x.ai" target="_blank" rel="noopener noreferrer">xAI</a> under their own terms. Ticket lookups happen on the City's
            official <a className="text-primary underline decoration-dotted" href="https://albany.rmcpay.com/" target="_blank" rel="noopener noreferrer">Ticketing &amp; Enforcement portal</a>.
            This tool is built for Albany residents and is not affiliated with the City of Albany.
          </p>
        </Section>

        <p className="mt-10 border-t border-dashed border-border pt-4 text-xs leading-relaxed text-muted-foreground/70">
          This page describes how the app handles data and is not a contract or legal advice. If you have questions
          about your specific ticket, consult a licensed New York attorney.
        </p>
      </main>
    </div>
  );
}
