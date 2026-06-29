import { readFileSync } from "fs";
import crypto from "crypto";

const sa = JSON.parse(readFileSync("scripts/service-account.json", "utf8"));

function base64url(buf) {
  return buf.toString("base64url");
}

function sign(header, payload, privateKey) {
  const data = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(data), privateKey);
  return `${data}.${base64url(sig)}`;
}

async function getAccessToken() {
  const privateKey = sa.private_key.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase",
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now - 60,
  };
  const assertion = sign(header, payload, privateKey);

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.access_token;
}

async function main() {
  const token = await getAccessToken();
  const projectId = "smart-student-13ce6";
  const rulesContent = readFileSync("firestore.rules", "utf8");

  // Check current release
  const getRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("Current release:", await getRes.text());

  // Create ruleset
  const createRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: { files: [{ name: "firestore.rules", content: rulesContent }] },
      }),
    }
  );

  if (!createRes.ok) {
    console.error("Create ruleset failed:", await createRes.text());
    return;
  }

  const ruleset = await createRes.json();
  console.log("Ruleset created:", ruleset.name);

  // Try PATCH with updateMask
  const releaseRes = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore?updateMask=rulesetName`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: ruleset.name,
      }),
    }
  );

  console.log("Release response status:", releaseRes.status);
  const releaseText = await releaseRes.text();
  console.log("Release response:", releaseText);
}

main().catch(console.error);
