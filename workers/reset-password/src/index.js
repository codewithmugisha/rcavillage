import { SignJWT, importPKCS8 } from "jose";
import nodemailer from "nodemailer";

const ALG = "RS256";
const SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/firebase",
].join(" ");

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: corsHeaders(request, env.ALLOWED_ORIGIN),
        });
      }

      const url = new URL(request.url);

      if (url.pathname === "/send-reset-link" && request.method === "POST") {
        return handleSendResetLink(request, env);
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      console.error("Unhandled error:", err);
      return json({ error: "Internal server error" }, 500, request, env);
    }
  },
};

async function handleSendResetLink(request, env) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, request, env);
    }

    const username = body?.username?.trim().toLowerCase();
    if (!username) {
      return json({ error: "Username is required" }, 400, request, env);
    }

    const accessToken = await getAccessToken(env);

    const userDoc = await queryUserByUsername(username, accessToken, env);
    if (!userDoc) {
      return json({ error: "No account found with that username" }, 404, request, env);
    }

    const recoveryEmail = userDoc.recoveryEmail;
    if (!recoveryEmail) {
      return json({ error: "No recovery email on file for this account" }, 400, request, env);
    }

    const resetLink = await generateResetLink(username, accessToken);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"RCA Village" <${env.GMAIL_USER}>`,
      to: recoveryEmail,
      subject: "Reset your RCA Village password",
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding: 48px 40px 32px; text-align: center;">
                <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px;">RCA Village</h1>
                <p style="margin: 0 0 32px; font-size: 15px; color: #888; font-weight: 400;">Password Reset</p>
                <div style="width: 48px; height: 3px; background: #1a1a1a; margin: 0 auto 32px; border-radius: 2px;"></div>
                <p style="margin: 0 0 8px; font-size: 16px; color: #333; line-height: 1.5;">
                  We received a request to reset your password.
                </p>
                <p style="margin: 0 0 32px; font-size: 16px; color: #333; line-height: 1.5;">
                  Click the button below to set a new one. This link expires in 1 hour.
                </p>
                <a href="${resetLink}"
                   style="display: inline-block; padding: 14px 36px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 40px; text-align: center; border-top: 1px solid #eee;">
                <p style="margin: 0; font-size: 13px; color: #aaa; line-height: 1.5;">
                  If you didn't request this, you can safely ignore this email.
                </p>
                <p style="margin: 8px 0 0; font-size: 13px; color: #aaa;">
                  &mdash; RCA Village Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });

    return json({ success: true, message: "Reset link sent to your recovery email", email: recoveryEmail }, 200, request, env);
  } catch (err) {
    console.error("handleSendResetLink error:", err);
    return json({ error: err.message || "Failed to send reset link" }, 500, request, env);
  }
}

async function getAccessToken(env) {
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const privateKey = sa.private_key.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const iat = now - 60;
  const exp = now + 3600;

  const privateCryptoKey = await importPKCS8(privateKey, ALG);

  const jwt = await new SignJWT({
    iss: sa.client_email,
    scope: SCOPES,
    aud: sa.token_uri,
    exp,
    iat,
  })
    .setProtectedHeader({ alg: ALG, typ: "JWT" })
    .sign(privateCryptoKey);

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

async function queryUserByUsername(username, accessToken, env) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "users" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "username" },
              op: "EQUAL",
              value: { stringValue: username },
            },
          },
          limit: 1,
        },
      }),
    }
  );

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const doc = data[0].document;
  if (!doc) return null;

  return flattenFirestoreDoc(doc.fields);
}

async function generateResetLink(username, accessToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email: `${username}@rca.app`,
        returnOobLink: true,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to generate reset link");
  return data.oobLink;
}

function flattenFirestoreDoc(fields) {
  if (!fields) return {};
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.integerValue !== undefined) result[key] = Number(value.integerValue);
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
    else if (value.timestampValue !== undefined) result[key] = value.timestampValue;
    else if (value.nullValue !== undefined) result[key] = null;
  }
  return result;
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, env?.ALLOWED_ORIGIN),
    },
  });
}

function corsHeaders(request, origin) {
  const allowed = origin || "http://localhost:5173";
  const reqOrigin = request?.headers?.get("Origin") || "";
  const match = reqOrigin === allowed
    || reqOrigin.endsWith(".rcavillage.pages.dev")
    || reqOrigin.startsWith("http://localhost")
    || (allowed && reqOrigin.endsWith(new URL(allowed).hostname));
  return {
    "Access-Control-Allow-Origin": match ? reqOrigin : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
