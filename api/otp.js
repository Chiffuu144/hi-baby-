const crypto = require("crypto");
const json = (res, status, body) => res.status(status).json(body);
const sign = value => crypto.createHmac("sha256", process.env.OTP_SIGNING_SECRET).update(value).digest("hex");

async function identity(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/, "");
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_WEB_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) });
  const data = await response.json();
  const user = data.users?.[0];
  if (!response.ok || !user?.email) throw new Error("Please sign in again.");
  return { uid: user.localId, email: user.email };
}
async function sendEmail(to, code) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY }, body: JSON.stringify({ sender: { name: "Our Little Love Letter 💌", email: process.env.BREVO_SENDER_EMAIL }, to: [{ email: to }], subject: "Your little love code 💌", htmlContent: `<h2>One tiny secret for you 💌</h2><p>Your verification code is <b style="font-size:28px;letter-spacing:6px">${code}</b></p><p>It expires in 10 minutes. Please keep it private.</p>` }) });
  if (!response.ok) throw new Error("Email service could not send the code yet.");
}
module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed." });
  try {
    const user = await identity(req);
    if (req.body.action === "send") {
      const code = crypto.randomInt(100000, 1000000).toString(), expires = Date.now() + 600000, salt = crypto.randomBytes(12).toString("hex");
      const payload = Buffer.from(JSON.stringify({ uid: user.uid, expires, salt, hash: crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex") })).toString("base64url");
      await sendEmail(user.email, code);
      return json(res, 200, { challenge: `${payload}.${sign(payload)}` });
    }
    const [payload, signature] = String(req.body.challenge || "").split(".");
    if (!payload || signature !== sign(payload)) throw new Error("Please request a new code.");
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    const valid = data.uid === user.uid && data.expires > Date.now() && crypto.timingSafeEqual(Buffer.from(data.hash), Buffer.from(crypto.createHash("sha256").update(`${data.salt}:${req.body.code}`).digest("hex")));
    if (!valid) throw new Error("That code is not correct or has expired.");
    return json(res, 200, { ok: true });
  } catch (error) { return json(res, 400, { error: error.message || "Could not verify the code." }); }
};
