# Deploy originbi to Vercel

The source is prepared for Vercel. A live deployment still requires your service accounts and credentials. Do not upload `.env.local`, `.local/`, or local lead records.

## Import and configure

1. Import https://github.com/mjsan-dosclub/VidyaConnect into Vercel. The app is at the repository root: leave Root Directory at its default (`.`).
2. Select **Next.js** and **Node.js 24.x**. `vercel.json` specifies `npm ci` and `npm run check:production && npm run build`. Keep the standard Next.js output directory; do not use a static export.
3. Create a Supabase project. Run `supabase/migration.sql` once in its SQL editor, then run `supabase/verify.sql` to check permissions, realtime publication, finalization, email queueing and rate limits. Verification rolls back its temporary fixtures. Create your manager in Supabase Auth and set their trusted `app_metadata.role` to `admin`. The DB field `school_name` is retained for compatibility; all visitor labels and the exported CSV header use institution/organisation terminology.
4. In Vercel → Project Settings → Environment Variables, add the following for Production and for any Preview environment where you want functional capture. Vercel variables are used in subsequent deployments; redeploy after changing them.

| Variable                      | Set to                                                                                | Browser-visible? |
| ----------------------------- | ------------------------------------------------------------------------------------- | ---------------- |
| NEXT_PUBLIC_APP_NAME          | originbi                                                                          | Yes              |
| NEXT_PUBLIC_APP_URL           | Your actual canonical HTTPS app domain, with no path                                  | Yes              |
| NEXT_PUBLIC_SUPABASE_URL      | Your Supabase project HTTPS URL                                                       | Yes              |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your Supabase anonymous/publishable client key                                        | Yes              |
| SUPABASE_SERVICE_ROLE_KEY     | Supabase service role key                                                             | No               |
| GEMINI_API_KEY                | Your Google AI Studio Gemini API key                                                  | No               |
| GEMINI_MODEL                  | gemini-3.5-flash-lite, or a supported structured-output model available to your account    | No               |
| RESEND_API_KEY                | Your Resend API key                                                                   | No               |
| EMAIL_FROM                    | originbi &lt;hello@your-verified-domain.com&gt; using a domain verified in Resend | No               |
| CRON_SECRET                   | An independent random secret, at least 32 characters                                  | No               |
| RATE_LIMIT_SALT               | A different independent random secret, at least 32 characters                         | No               |
| LOCAL_PREVIEW_MODE            | false                                                                                 | No               |

Generate each secret separately with `openssl rand -hex 32`. Enter secrets in Vercel settings, never in source or NEXT_PUBLIC variables. The preflight checks presence and URL/secret shape; it does not contact providers or prove the supplied credentials are valid.

5. Deploy. Vercel's build fails early with variable **names only** if required configuration is missing. No secret values are logged by the checker. Local SQLite fallback is also disabled whenever `VERCEL` is set, even if the local flag is accidentally enabled; production requires Supabase.
6. After deployment, verify the actual domain matches NEXT_PUBLIC_APP_URL. Redeploy if you change the domain, display name, public Supabase values or other browser-visible configuration.
7. Run the mobile checks below before printing the event QR code. The local SQLite database is not migrated automatically: only new production submissions go to Supabase. Arrange an explicit export/import if you need existing local records.

## Does voice work on Vercel?

Yes, the architecture supports it. Recognition happens in the visitor's browser using Web Speech API; Vercel serves the web app and runs the Gemini extraction API in a Node.js function. The visitor explicitly taps Submit after reviewing the transcript. The server persists a Supabase draft before calling Gemini, so extraction errors do not discard the raw introduction.

Recognition support varies by browser/device. Some browsers send audio to their vendor's recognition service and require network access. Use the deployed HTTPS URL, grant microphone permission and test your actual attendee phones. If recognition is unavailable or denied, the editable transcript and Manual Form remain available. HTTPS hosting does not add support to a browser that lacks SpeechRecognition.

The current recognition language is **en-IN (Indian English)**. This is speech-to-text followed by structured lead extraction, not multilingual translation. No translation between Tamil/Hindi/English has been implemented.

The Gemini API key stays on the server. The extraction route allows up to 60 seconds, with a 45-second provider timeout. Confirmation and email retry use Node.js functions. Confirmation creates a durable email outbox record alongside the lead; provider delivery failures leave the lead saved. The supplied retry cron runs daily; choose a more frequent supported schedule if required for your event.

## Before opening to attendees

- On a physical phone over HTTPS, test microphone permission allowed/denied, recognition stopping on silence, editable numbers and an explicit Submit tap. Silence must never submit.
- Complete a voice submission and verify its raw draft in Supabase before AI confirmation; test a spoken double/triple mobile number.
- Confirm and verify status `confirmed`, reviewed institution name and requirements; manual capture should become `submitted` with an IST callback slot.
- Sign in to `/admin` as a manager on a laptop. Verify realtime feed and CSV export. Anonymous and non-manager accounts must remain denied.
- Verify Resend sender acceptance, email_sent state and an authenticated retry after a simulated provider failure.
- Check the 767/768px viewport boundary and scan the production QR with another device.

## Sources

- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [MDN SpeechRecognition compatibility](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)

The displayed application name is fixed to originbi. A legacy NEXT_PUBLIC_APP_NAME value is ignored. The existing Vercel URL and Git repository remain usable after rebranding.
