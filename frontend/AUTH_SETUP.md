# Turn on real email verification

This site uses Firebase Authentication. Firebase sends a verification link to the exact email address entered (including Gmail), and the site unlocks only after that link is confirmed.

1. Create a project at [Firebase Console](https://console.firebase.google.com/), then add a **Web app**.
2. In **Authentication** → **Sign-in method**, enable **Email/Password**.
3. Copy the Web app configuration shown in **Project settings** and replace every `PASTE_...` value in `firebase-config.js`.
4. In **Authentication** → **Settings** → **Authorized domains**, add the domain where you publish this site (Firebase's default includes `localhost`).
5. Publish the `frontend` folder using Firebase Hosting, Netlify, GitHub Pages, or another HTTPS host. Do not open the pages directly as `file://`—the Firebase browser module needs a web server.

The Firebase web configuration is intentionally safe to expose in browser code. Keep any Firebase Admin SDK keys or service-account files private and out of this folder.
