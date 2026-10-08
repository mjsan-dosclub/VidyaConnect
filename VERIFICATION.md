# Verification

Verified locally on 8 October 2026.

- Next.js production build: passed; all visitor, admin and API routes compiled.
- TypeScript: passed during production build and standalone typecheck.
- Unit tests: 11 passed (spoken digits, phone validation, extraction schema, required manual fields, CSV escaping/formula prevention, same-origin validation).
- `npm audit --omit=dev`: 0 known vulnerabilities at verification time.
- Production HTTP server: visitor and admin pages returned 200.
- Unauthenticated admin lead API and email retry route: 401.
- Same-origin draft request: reaches service configuration check; returns 503 when Supabase/secrets are absent. A local 127.0.0.1 origin-normalization issue was found and fixed.
- Browser at 390px: voice mode, editable transcript, explicit Submit button and manual form render correctly. The submit button is disabled for empty transcripts. Missing-service errors are visible and do not create a success state.
- Browser at 767px: visitor UI visible, mobile content column capped at 480px.
- Browser at 768px: branded mobile-only blocker and dynamic route QR shown. Admin login remains accessible without the blocker.
- Saved mobile screenshot: `mobile-preview.jpg`.

Not verified without service credentials: SQL execution/RLS integration, actual lead writes, Gemini extraction quality, Supabase realtime delivery, authorized dashboard data, Resend delivery/retry, physical-device microphone and a Vercel deployment. Follow README.md's pre-event checks after configuration. No live event records or emails were created during these checks.

## Cream theme and local submission update

- Cream light palette applied to visitor screens, mobile blocker, forms and admin sign-in.
- Submit saves to local SQLite when LOCAL_PREVIEW_MODE=true.
- Browser test: transcript → Submit → review form → Confirm & Send → thank-you.
- Independent database read confirmed exactly one finalized test lead, original raw transcript, reviewed requirements and objective. The isolated QA record was removed after verification.
- Local persistence tests cover draft edits, wrong-owner rejection, finalization idempotency, mode isolation, request limiting and Vercel fallback exclusion.
- No AI results are fabricated in local mode. Without Gemini, the review screen asks the attendee to fill in details. Local email is explicitly disconnected.
- Production build and all 11 tests passed. External integrations remain unverified without credentials.

## VidyaConnect / Vercel preparation

- Application brand updated to VidyaConnect across visitor UI, metadata, consent and React Email.
- Visible School name labels replaced with Institution / organisation name, including voice cues and manager search/fallback text; database/API field retained for compatibility.
- Vercel Node.js 24.x, installation/build commands, production environment checks and source upload exclusions supplied.
- 14 tests pass, including production checker coverage for missing configuration, secret-free output, local-mode exclusion and HTTPS requirements.
- Live Gemini, Supabase and Resend credentials are still absent, so provider integration and Vercel deployment remain unverified.

## Clean repository verification before GitHub push

- Installed dependencies from package-lock.json in the clean repository checkout.
- Ran all 14 tests with Node.js 24.21.0: passed.
- Built the Next.js production bundle with Node.js 24.21.0: passed, including TypeScript.
- Repository root is the Vercel project root; GitHub Actions verifies tests and build on Node.js 24.
- No .env.local, local SQLite records, node_modules, screenshots or build output are included in Git.
