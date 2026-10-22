# GlowScan AI

Premium, responsive skincare guidance website built with Next.js App Router, React and TypeScript. The interface supports English/Hinglish toggle, selfie upload, skin questionnaire, real vision-model analysis through a server API route, ingredient guidance, AM/PM routines, product-type suggestions, and clear demo-vs-real labels.

## Important truth about analysis

- The website does **not** invent a score when the AI key is missing. It shows a setup message and no score.
- Real image analysis requires a valid server-side API key for a vision-capable model.
- Results are cosmetic education, not medical diagnosis or treatment. Image lighting, makeup, camera quality and skin tone can affect observations.
- No user account or database is included. The uploaded image is held in browser memory for preview and sent to `/api/analyze` only after the user clicks Analyze. The API route passes it to the configured AI provider. Provider policies apply. Use the remove/delete controls to clear the preview/results.
- The upload flow includes client-side basic checks for resolution, approximate brightness and contrast, practical retake guidance, a user-written notes field (sent as context only), and explicit consent before sending the image to the configured provider. These checks cannot establish focus, detect all filters, or guarantee reliable/clinical analysis.
- A professional, printable recognition certificate can be generated only when a real AI result returns a score of 80/100 or higher. It is explicitly a non-medical recognition certificate, not an official qualification or proof of skin health. The certificate is generated in the user's browser and is not stored on a server. The optional email field is not currently used or saved.
- This starter does not save historical progress to a server or cloud account. If adding persistent progress tracking later, implement explicit consent, authentication, deletion and retention controls first.

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env.local`.
3. Set `OPENAI_API_KEY` to a valid key and optionally set `OPENAI_VISION_MODEL` to a vision-capable model available to your account.
4. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Without the key, the page still runs but clearly tells users that real analysis is not configured. Do not put the key in a `NEXT_PUBLIC_` variable or commit `.env.local`.

## Deploy to Vercel

1. Create a GitHub repository and upload this project.
2. Import the repository in Vercel.
3. In Vercel Project → Settings → Environment Variables, add `OPENAI_API_KEY` and optionally `OPENAI_VISION_MODEL` for Preview and Production.
4. Redeploy after setting environment variables.
5. Test with a small JPG/PNG/WebP selfie and verify that the result mode says “AI image analysis”.
6. Add a proper privacy policy, terms, abuse/rate limiting and provider-cost controls before public launch.

## Production checklist

- Add rate limiting / bot protection to `/api/analyze` to prevent API-cost abuse.
- Consider authentication or per-IP limits, request logging without image content, and strict usage limits.
- Confirm the provider's image-data retention and privacy policies match your commitments.
- For minors, obtain appropriate consent and avoid appearance scoring; consider disabling score display entirely.
- Do not market the score as objective beauty, health, or a medical assessment.
- Use licensed images and replace the demo hero image with your own licensed brand imagery.
- Automated progress history is not included yet. This build does not persist selfies or analysis history.

## Project structure

- `app/page.tsx` — page entry
- `app/ui/GlowScan.tsx` — responsive client UI and user interactions
- `app/api/analyze/route.ts` — server-side vision API request
- `app/globals.css` — premium responsive design
- `.env.example` — required server environment variables


## Advanced features included

- Responsive layouts for mobile, tablet and desktop, plus reduced-motion support.
- Basic selfie resolution, brightness and contrast checks before analysis (not a clinical quality detector).
- Optional user notes for routine goals and product reactions.
- Device-local progress log that stores score/date/summary only, not photos or notes.
- AM/PM routine checklist stored in the current browser.
- Clear local history controls and photo/result removal.
- Bilingual English/Hinglish interface, with certificate eligibility safeguards.

Local history is not cloud sync and may be lost when browser storage is cleared or when using another device. A score trend is not medical evidence of improvement.


## Glow leaderboard
- Users can add a display name and a score from a successful real-AI analysis.
- Entries are ranked by score descending; certificate eligibility (score 80+ and certificate form details) breaks ties.
- The leaderboard is stored in browser localStorage on the current device only. It is **not global, public, account-backed, or identity-verified**.
- A true cross-user public leaderboard requires a database, authentication, server-side score validation, abuse prevention/rate limiting, moderation, and a privacy notice. Do not present local rankings as a public competition.


## Public leaderboard setup (Supabase)
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase-leaderboard.sql`.
3. In Vercel Project Settings → Environment Variables, add:
   - `SUPABASE_URL` — your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — the service-role key; server-side only, never prefix it with `NEXT_PUBLIC_`.
   - `GLOWSCAN_LEADERBOARD_SECRET` — a long random secret (at least 32 characters). Keep it private.
4. Ensure `OPENAI_API_KEY` is configured too. The analysis API issues a short-lived signed token only for a real AI score when the leaderboard secret is configured. The leaderboard API validates that token and uses a unique nonce to block reusing the same scan token.
5. Redeploy the Vercel project after adding environment variables.

The public leaderboard shows display names and scores to all visitors. Do not enter a full legal name or other sensitive information. It ranks scores descending, with 80+ certificate eligibility as a tie-breaker and earlier entries first when still tied. This score is an AI-estimated visible-skin appearance indicator, not a measure of beauty, worth, or health. Identity is not verified. The service-role key and signing secret must never be exposed to the browser.

Operational note: add provider-appropriate rate limiting/abuse monitoring before promoting this feature widely. The signed score token expires after 10 minutes and can be submitted only once because its nonce is unique in the database.
