# Albany Parking Ticket Appeal

A web app that helps City of Albany, NY residents appeal parking tickets quickly and correctly. It walks users through eligibility, deadlines, and the official appeal channels, looks up tickets via the official Albany portal, and helps draft a FOIL request.

> **Accuracy note:** Every policy fact, deadline, and contact in this app is sourced from the City of Albany's official Parking Violations Bureau page. The ticket lookup hands off to the official portal (`albany.rmcpay.com`) — the app never fabricates ticket data.

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Express (Node 20+)
- **Build:** single bundle via `tsx script/build.ts`

## Local Development

```bash
npm install
npm run dev          # starts on http://localhost:5000
```

## Production Build

```bash
npm run build        # outputs to dist/
npm start            # runs dist/index.cjs (honors $PORT)
```

## Environment Variables

All variables are **optional** — the app runs fully without any of them. See [`.env.example`](./.env.example).

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `5000` | Server port. Railway sets this automatically. |
| `OPENAI_API_KEY` | No | — | Enables "snap a photo of your ticket" auto-fill (OpenAI vision OCR). Without it, the app asks the user to type fields manually. |
| `OPENAI_VISION_MODEL` | No | `gpt-4o` | Vision model used for OCR. |

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo → select this repo.**
3. Railway auto-detects Nixpacks and uses the build/start commands in [`railway.json`](./railway.json).
4. (Optional) Add `OPENAI_API_KEY` under **Variables** if you want photo auto-fill.
5. Under **Settings → Networking**, click **Generate Domain** to get a public URL.

Do **not** set `PORT` manually on Railway — it injects its own.

## Official Albany Resources

- Parking Violations Bureau: https://www.albanyny.gov/403/Parking-Violations-Bureau
- Pay bills / tickets: https://www.albanyny.gov/145/Pay-Bills-Tickets-Invoices
- Ticket lookup portal: https://albany.rmcpay.com/
