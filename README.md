# Sjakkbrett fra bilde

Mobiltilpasset webapp som gjør et fotografi av et fysisk sjakkbrett om til en redigerbar digital sjakkstilling. Du tar eller velger bilde, beskjærer brettet, sender det til OpenAI via en sikker Cloudflare Worker, kontrollerer stillingen manuelt og analyserer varianter med vanlige sjakkregler (`chess.js`). Bilder lagres ikke.

## Arkitektur

| Del | Teknologi | Rolle |
|-----|-----------|--------|
| Frontend | React, Vite, TypeScript, Tailwind | Statisk app på **GitHub Pages** |
| API | Cloudflare Worker | Turnstile, CORS, OpenAI Responses API |
| CI | GitHub Actions | Bygg, test, lint, publiser `dist` — **ikke backend** |

OpenAI API-nøkkelen finnes **kun** som Cloudflare Worker-secret. Den skal aldri i frontend, `VITE_*`-variabler eller GitHub Pages-artifacts.

## Krav

- Node.js 22+ anbefales (GitHub Actions bruker 22)
- Cloudflare-konto (Worker + Turnstile)
- OpenAI API-nøkkel med tilgang til valgt modell (standard `gpt-5.6`)

## Installasjon

```bash
npm install
```

## Lokal utvikling

1. Kopier miljøfiler:

   ```bash
   cp .env.example .env.local
   cp worker/.dev.vars.example worker/.dev.vars
   ```

2. Fyll inn `worker/.dev.vars` (lokal fil, gitignored):

   - `OPENAI_API_KEY` — din OpenAI-nøkkel
   - `TURNSTILE_SECRET` — kan være tom lokalt hvis bypass er på
   - `DEV_ALLOW_TURNSTILE_BYPASS=true` og origin `http://localhost:5173`

3. Sett i `.env.local`:

   ```env
   VITE_API_URL=http://localhost:8787
   VITE_TURNSTILE_SITE_KEY=<valgfritt lokalt>
   ```

4. Start:

   ```bash
   npm run dev          # frontend :5173
   npm run dev:worker   # worker :8787
   npm run dev:all      # begge
   ```

```bash
npm test
npm run build
```

## Cloudflare Worker

### Innlogging

```bash
npx wrangler login
```

### Secrets (produksjon)

```bash
npx wrangler secret put OPENAI_API_KEY --config worker/wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET --config worker/wrangler.jsonc
```

### Vanlige variabler (`worker/wrangler.jsonc` eller dashboard)

- `OPENAI_MODEL` — standard `gpt-5.6`; bytt f.eks. til `gpt-5.6-terra` uten kodeendring
- `ALLOWED_ORIGINS` — kommaseparert, kun protokoll + vertsnavn, f.eks.  
  `http://localhost:5173,https://BRUKERNAVN.github.io`

### Deploy

```bash
npm run deploy:worker
```

Worker-URL finner du i Wrangler-output eller Cloudflare-dashboard (Workers & Pages → din worker → **Triggers** / workers.dev-URL).

Health: `GET <WORKER_URL>/health` → `{"ok":true}`

## GitHub Pages

1. Aktiver **Pages** i repo: Settings → Pages → Source: **GitHub Actions**.
2. Opprett **Repository variables** (Settings → Secrets and variables → Actions → Variables):

   | Variabel | Eksempel |
   |----------|----------|
   | `VITE_API_URL` | `https://sjakk-analyse-worker.<konto>.workers.dev` |
   | `VITE_TURNSTILE_SITE_KEY` | Turnstile **site key** (offentlig) |
   | `VITE_BASE_PATH` | Valgfri, f.eks. `/sjakk-analyse/` |

   Uten `VITE_BASE_PATH` setter build automatisk `/REPOSITORY_NAVN/` fra `GITHUB_REPOSITORY`, eller `/` for `BRUKERNAVN.github.io`.

3. Push til `main` — workflow `.github/workflows/deploy-pages.yml` kjører lint, test, build og deploy.

## Turnstile

1. Cloudflare Dashboard → Turnstile → Create site.
2. **Site key** → `VITE_TURNSTILE_SITE_KEY` (GitHub variable) og lokalt i `.env.local`.
3. **Secret key** → `TURNSTILE_SECRET` (Wrangler secret).
4. Legg produksjons-origin i `ALLOWED_ORIGINS` (uten repo-sti).

Lokal bypass: kun når `DEV_ALLOW_TURNSTILE_BYPASS=true` **og** origin er localhost/127.0.0.1.

## Begrens API-forbruk

- Turnstile per analyse
- Streng request-størrelse og tillatte origins på Worker
- Eget OpenAI-budsjett / rate limits i OpenAI-dashboard
- Ingen automatiske retries mot OpenAI i Worker

## Kjente begrensninger

- Bildegjenkjenning er feilbar — **kontroller alltid** stillingen.
- Hvem som er i trekket, rokade og historikk før foto kan **ikke** utledes fra bildet.
- En passant støttes ikke i MVP.
- Ingen Stockfish / ingen automatiske beste trekk.
- «Analyse» = du flytter brikker og utforsker varianter selv.

## Prosjektstruktur (kort)

- `src/` — React-app
- `shared/board-recognition-schema.ts` — delt Zod-skjema
- `worker/` — Cloudflare Worker
- `tests/` — Vitest

## Kommandoer

```bash
npm install
npm run dev
npm run dev:worker
npm run dev:all
npm test
npm run build
npm run deploy:worker
```
