# VidyaConnect

Repository: https://github.com/mjsan-dosclub/VidyaConnect

For Vercel import, use the repository root (`.`). Follow [DEPLOYMENT.md](DEPLOYMENT.md) before the first deployment.

A mobile-first summit lead capture app built with Next.js App Router, TypeScript, Tailwind CSS, Lucide, Framer Motion, Gemini (`@google/genai`), Supabase, Resend and React Email. Deploy to Vercel.

The web UI adapts the Astra liquid-glass patterns from [Appllama/liquid-glass-chat-ui](https://github.com/Appllama/liquid-glass-chat-ui). Native iOS glass shaders are represented with CSS blur, translucent layers, rounded panels and spring-compatible animation. See THIRD_PARTY_NOTICES.md.

## Local development

Use Node.js 24.x, matching the configured Vercel runtime.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 on a mobile viewport; `/admin` works at all widths. Visitors >=768px see a QR blocker. The content column stays <=480px at all smaller widths. This is a viewport UX restriction, not a security boundary. Disable JavaScript and the CSS blocker still applies.

For a working local preview without external credentials, set `LOCAL_PREVIEW_MODE=true` in `.env.local`. This mode stores real local drafts and finalized leads in `.local/karyaai.sqlite`. It requires a Node version with `node:sqlite` (Node 22.13+). The directory is ignored by Git and must not be included in source archives. Owner capabilities, immutable finalization and request limiting remain enforced.

When Gemini is absent in local mode, Submit opens a manual review screen with the saved transcript; it does not fabricate AI-extracted details. When a Gemini key is supplied, the existing structured extraction is used. Local mode does not send emails or support the Supabase manager feed; the thank-you screen explains that the lead is stored on this computer. Supabase manager sign-in requires its configured service.

Local fallback is explicitly opt-in and is disabled automatically on Vercel. With local mode off, missing services fail clearly instead of silently switching storage.

## Service setup

1. Create a Supabase project and apply `supabase/migration.sql` **once** in the SQL editor. The migration creates leads, RLS, the realtime publication, a durable email outbox and distributed request limiting.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Only the first two are public; never expose the service role key.
3. Create a manager in Supabase Auth. From a trusted server or the Supabase dashboard, set the manager's **app_metadata** to `{"role":"admin"}`. Do not use user_metadata: users can modify it. Reauthenticate after assigning the role. Public sign-up does not grant lead access.
4. Set `GEMINI_API_KEY`, and optionally `GEMINI_MODEL`. Default model: `gemini-2.5-flash`; select an available structured-output model in your Google account.
5. Verify a sender domain with Resend. Set `RESEND_API_KEY` and `EMAIL_FROM` to a sender on that domain.
6. Generate independent random secrets for `RATE_LIMIT_SALT` and `CRON_SECRET`, for example `openssl rand -hex 32`. Keep them in environment configuration.
7. Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS deployment URL so QR codes point to the deployed site. A localhost QR cannot open the app on another device; mobile microphone testing requires a deployed HTTPS URL or a trusted HTTPS local tunnel.

## Deploy to Vercel

Import this folder as the project root, select Next.js and add the environment variables above for Production. The Vercel build command is `npm run check:production && npm run build`; this prevents deployment without configured services. See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete environment table and voice compatibility notes. Deploy, set `NEXT_PUBLIC_APP_URL` to the assigned domain and redeploy so the public variable is included in client assets. Prefer a stable custom domain before printing event QR codes.

`vercel.json` includes a daily email retry job compatible with a daily cron schedule. Resend is attempted immediately after every finalization; failed delivery stays queued. Use a more frequent cron on a Vercel plan supporting it if your event requires faster retries. Vercel supplies `Authorization: Bearer <CRON_SECRET>` for the cron route. Never make the retry endpoint public without its secret.

## Data and behavior

- Speech uses the browser's Web Speech API in `en-IN`. Unsupported browsers, denied permissions and recognition interruptions retain an editable textarea. The browser/vendor may process speech remotely. No audio recording is stored by this app.
- Silence stops recognition where the browser requires it; it never triggers a submit. The visitor must tap **Submit**.
- A client-generated UUID and a cryptographically random per-lead capability make retries idempotent. Only a SHA-256 capability hash is stored on the server. Session state is separated by mode. The token lives in sessionStorage, never in a URL or CSV export.
- `/api/draft` persists the raw transcript **before** the Gemini request. AI errors leave `draft` visible to managers, including the raw transcript. Edits and retries update the same draft. Once finalized, a lead is immutable to visitor retries.
- `/api/parse-voice` loads the stored transcript, requests schema-constrained JSON, validates the result and saves extracted fields while preserving draft status. Missing names/numbers remain blank so the visitor can supply them. The model is instructed to expand double/triple digits and normalize Indian mobile numbers; the server rejects invalid extracted numbers.
- Confirmation validates the 10-digit mobile number, name and objective. Email is optional in voice mode; there is no way to email a phone-only lead. The confirmation screen therefore includes an optional email field. Manual mode requires email and callback fields.
- Confirming and queuing email happen in one database transaction. Email failure never reverses a confirmed/submitted lead. Resend idempotency keys reduce duplicate delivery; its idempotency window is provider-defined, so delivery is at least once across exceptional delayed retries. `email_sent` is set only after provider acceptance, not recipient delivery. Voice leads become `confirmed`; manual leads become `submitted`.
- `/admin` verifies Supabase Auth. The server independently checks `app_metadata.role=admin` for every list request. RLS limits realtime reads to the same role. Visitor APIs are the only public write path; table reads/writes and privileged SQL functions are unavailable to anonymous users.
- The manager feed subscribes to Supabase realtime, refreshes on changes and polls every 30 seconds as a reconnect fallback. It loads the latest 5,000 leads; exports include only the current filtered results. CSV cells escape quotes and neutralize leading spreadsheet formula characters.
- Callback dates and slots use India time. There are server-side validation, same-origin POST checks and shared-IP request limiting (30 API requests per minute). For a large booth on shared Wi-Fi, tune `consume_rate_limit` before the event; one voice flow uses three requests.

## Verification

```sh
npm run test
npm run typecheck
npm run build
npm audit --omit=dev
```

Before the event, with configured services, verify:

- Anonymous and non-manager accounts cannot read leads or invoke privileged functions.
- Desktop visitor URLs show the blocker; admin remains usable. At 390px, test all screens, keyboard behavior and zoom. Test the 767/768px boundary.
- On a physical phone over HTTPS, allow and deny microphone permissions, speak double/triple mobile digits, edit the transcript and verify silence never submits.
- Disable Gemini after creating a draft; confirm the draft remains in the admin feed. Retry the same lead after restoring Gemini.
- Complete voice and manual captures; inspect stored phone/requirements/callback/status and the realtime feed.
- Retry confirmation and manual submission with the same capability; no duplicate lead/outbox should be created. Submit with a different token; access must be denied.
- Disable Resend, finalize a lead, then restore Resend and run the authenticated retry endpoint; the lead must remain saved and the outbox should eventually mark it sent.
- Export quotes, commas and formula-looking notes, and confirm the CSV opens safely.

Live Supabase/Gemini/Resend behavior and physical-device speech require credentials and cannot be verified from an unconfigured workspace. Configure retention, backup and operational alerts in your service accounts before collecting event data. The repository contains deployment configuration; it is not deployed until a Vercel project is connected.

## Brand and terminology

The application is named VidyaConnect. Set NEXT_PUBLIC_APP_NAME to change the displayed brand and redeploy. Visible fields use “Institution / organisation name”; the existing school_name database field and API key are retained for backward compatibility. CSV exports label it institution_organisation_name.
