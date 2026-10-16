// Edit-mode login backend for the website (see src/lib/edit.ts and the README).
// Lives in the crew Google account's Apps Script project, deployed as a web app with
//   Execute as: Me   /   Who has access: Anyone
// The site lets people pick their Google account ("Sign in with Google") and POSTs the resulting ID token here.
// This checks the token with Google and the email against ALLOWED_EMAILS, and answers with a GitHub App
// installation token (expires after 1h, this repo only, file contents only).
// Script properties: CLIENT_ID, ALLOWED_EMAILS (comma or space separated), APP_ID, INSTALLATION_ID,
// PRIVATE_KEY (PKCS#8 PEM, newlines written as \n). Visitors can't see the code or the properties.

const REPO = "FusianDance.github.io";

// Opening the web app URL in a browser shows this: handy to check the deployment.
function doGet() {
  return ContentService.createTextOutput("Fusian edit login is running.");
}

function doPost(e) {
  let answer;
  try {
    answer = login(e.postData.contents);
  } catch (err) {
    answer = { error: `Login script error: ${err.message || err}` };
  }
  return ContentService.createTextOutput(JSON.stringify(answer)).setMimeType(ContentService.MimeType.JSON);
}

function login(idToken) {
  const p = PropertiesService.getScriptProperties().getProperties();
  // Google checks signature and expiry. The audience check makes sure the token was issued for our site.
  const res = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo", {
    method: "post",
    payload: { id_token: idToken },
    muteHttpExceptions: true,
  });
  const id = res.getResponseCode() === 200 ? JSON.parse(res.getContentText()) : {};
  if (id.aud !== p.CLIENT_ID || String(id.email_verified) !== "true") {
    return { error: "Google login failed, please try again." };
  }
  const email = String(id.email).toLowerCase();
  const allowed = String(p.ALLOWED_EMAILS || "")
    .toLowerCase()
    .split(/[\s,]+/);
  if (!allowed.includes(email)) {
    return { error: `${email} may not edit the website. Ask the crew to add it, or log in with another account.` };
  }
  const { token, expires_at } = installationToken(p);
  return { token, expires_at };
}

function installationToken(p) {
  const b64 = (data) => Utilities.base64EncodeWebSafe(data).replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64(JSON.stringify({ alg: "RS256", typ: "JWT" })) +
    "." +
    b64(JSON.stringify({ iat: now - 60, exp: now + 540, iss: p.APP_ID }));
  const key = p.PRIVATE_KEY.replace(/\\n/g, "\n");
  const jwt = unsigned + "." + b64(Utilities.computeRsaSha256Signature(unsigned, key));
  const res = UrlFetchApp.fetch(`https://api.github.com/app/installations/${p.INSTALLATION_ID}/access_tokens`, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/vnd.github+json" },
    payload: JSON.stringify({ repositories: [REPO], permissions: { contents: "write" } }),
  });
  return JSON.parse(res.getContentText());
}
