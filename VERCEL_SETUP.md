# Free Vercel code backend

This replaces Firebase Cloud Functions, so the Firebase project can remain on the free Spark plan. Vercel hosts both `frontend` and `api/otp.js`.

1. Create free accounts at Vercel and Brevo.
2. In Brevo, add your Gmail address as a sender and confirm the verification email. Create an API key.
3. Import this project folder into Vercel. In **Project Settings → Environment Variables**, add:
   - `BREVO_API_KEY` — from Brevo
   - `BREVO_SENDER_EMAIL` — the verified sender Gmail
   - `FIREBASE_WEB_API_KEY` — the Firebase web API key already in `frontend/firebase-config.js`
   - `OTP_SIGNING_SECRET` — a long, random private value
4. Deploy. Vercel gives you a `.vercel.app` address. Add this address in Firebase Authentication → Settings → Authorized domains.

The code expires after ten minutes. Because no paid database is used, it is verified per browser session; a sign-in in a new browser/session requests a new code.
