import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig, verificationApiBaseUrl } from "./firebase-config.js";

const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
const overlay = document.getElementById("authOverlay"), form = document.getElementById("authForm");
const title = document.getElementById("authTitle"), subtitle = document.getElementById("authSubtitle");
const submit = document.getElementById("authSubmit"), toggle = document.getElementById("authToggle");
const message = document.getElementById("authMessage"), password = document.getElementById("authPassword");
const nameField = document.getElementById("authNameField"), nameInput = document.getElementById("authName");
const codeActions = document.getElementById("verifyActions"), codeForm = document.getElementById("codeForm");
const codeInput = document.getElementById("verificationCode");
let signUpMode = false, auth;

function setMessage(text, kind = "") { message.textContent = text; message.className = `auth-message ${kind}`; }
function showAuth() { overlay.classList.remove("hidden"); document.body.classList.add("auth-pending"); }
function unlock() { overlay.classList.add("hidden"); document.body.classList.remove("auth-pending"); }
function showCodeScreen(user) {
  showAuth(); form.classList.add("hidden"); codeActions.classList.remove("hidden");
  title.textContent = "A tiny secret code 💌";
  subtitle.textContent = `We’ll send a 6-digit code to ${user.email}. Enter it here to prove this inbox is truly yours.`;
  codeInput.value = "";
}
function setMode(signUp) {
  signUpMode = signUp; form.classList.remove("hidden"); codeActions.classList.add("hidden");
  nameField.classList.toggle("hidden", !signUp); nameInput.required = signUp;
  title.textContent = signUp ? "Make our little account 💗" : "Welcome back, love 💗";
  subtitle.textContent = signUp ? "Create an account and we’ll send a secret code to your email." : "Sign in to open your sweet little corner.";
  submit.textContent = signUp ? "Create my account ✨" : "Sign in 💕";
  toggle.textContent = signUp ? "Already have an account? Sign in" : "New here? Create an account"; setMessage("");
}
function friendlyError(error) {
  return ({ "auth/email-already-in-use": "That email already has an account. Try signing in instead.", "auth/invalid-credential": "That email or password doesn’t match. Try again, love.", "auth/weak-password": "Please use a password with at least 6 characters.", "auth/invalid-email": "Please enter a valid email address.", "auth/too-many-requests": "Too many tries for now. Please wait a little and try again." })[error.code] || "Something went wrong. Please try again in a moment.";
}
async function callVerificationApi(body = {}) {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(verificationApiBaseUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to contact the verification service.");
  return data;
}
async function sendCode() {
  setMessage("Sending your little secret code…");
  try { const data = await callVerificationApi({ action: "send" }); sessionStorage.setItem("otpChallenge", data.challenge); setMessage("Your 6-digit code is on its way. 💌", "success"); }
  catch (error) { setMessage(error.message, "error"); }
}

if (!configured) {
  showAuth(); form.classList.add("hidden"); title.textContent = "Authentication needs setup";
  subtitle.textContent = "Add your Firebase web-app settings in firebase-config.js to turn on login.";
  setMessage("No email is collected until Firebase is configured.", "notice");
} else {
  auth = getAuth(initializeApp(firebaseConfig));
  onAuthStateChanged(auth, user => { if (user?.emailVerified || (user && sessionStorage.getItem(`otpVerified:${user.uid}`) === "true")) unlock(); else if (user) showCodeScreen(user); else { showAuth(); setMode(false); } });
  form.addEventListener("submit", async event => {
    event.preventDefault(); const email = document.getElementById("authEmail").value.trim(); submit.disabled = true;
    setMessage(signUpMode ? "Creating your account…" : "Signing you in…");
    try {
      const credential = signUpMode ? await createUserWithEmailAndPassword(auth, email, password.value) : await signInWithEmailAndPassword(auth, email, password.value);
      await credential.user.reload();
      if (auth.currentUser.emailVerified) unlock(); else { showCodeScreen(auth.currentUser); await sendCode(); }
    } catch (error) { setMessage(friendlyError(error), "error"); } finally { submit.disabled = false; }
  });
  toggle.addEventListener("click", () => setMode(!signUpMode));
  document.getElementById("resendVerification").addEventListener("click", sendCode);
  codeForm.addEventListener("submit", async event => {
    event.preventDefault(); const code = codeInput.value.replace(/\D/g, "");
    if (code.length !== 6) return setMessage("Please enter all 6 numbers from your email.", "error");
    setMessage("Checking your secret code…");
    try { await callVerificationApi({ action: "verify", code, challenge: sessionStorage.getItem("otpChallenge") }); sessionStorage.setItem(`otpVerified:${auth.currentUser.uid}`, "true"); unlock(); }
    catch (error) { setMessage(error.message, "error"); }
  });
  document.getElementById("useDifferentAccount").addEventListener("click", () => signOut(auth));
}
