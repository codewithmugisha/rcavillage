import { SignJWT, importPKCS8 } from "jose";

const ALG = "RS256";
const SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/firebase",
].join(" ");

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handlePairing(env));
  },

  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (request.method === "POST") {
      const result = await handlePairing(env);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Send POST to trigger pairing", { status: 200 });
  },
};

async function handlePairing(env) {
  console.log("Starting weekly pairing generation...");

  const accessToken = await getAccessToken(env);
  const weekKey = getCurrentWeekKey();
  const prevWeekKey = getPreviousWeekKey();

  console.log(`Week: ${weekKey}, Previous week: ${prevWeekKey}`);

  const allUsers = await fetchAllUsers(accessToken, env);
  console.log(`Found ${allUsers.length} users`);

  const prevPairings = await fetchPairingsForWeek(prevWeekKey, accessToken, env);
  console.log(`Found ${prevPairings.length} previous pairings`);

  const userStrikes = calculateStrikes(allUsers, prevPairings);

  const eligibleUsers = allUsers.filter((u) => {
    const strikes = userStrikes[u.uid] ?? 0;
    return strikes < 2;
  });
  const skippedUsers = allUsers.filter((u) => {
    const strikes = userStrikes[u.uid] ?? 0;
    return strikes >= 2;
  });

  console.log(`${eligibleUsers.length} eligible, ${skippedUsers.length} skipped`);

  const byClass = {};
  for (const u of eligibleUsers) {
    const c = u.class || "Unknown";
    if (!byClass[c]) byClass[c] = [];
    byClass[c].push(u);
  }

  let pairIndex = 0;
  const allPairDocs = [];

  for (const [className, students] of Object.entries(byClass)) {
    if (students.length < 2) {
      console.log(`  ${className}: ${students.length} student(s), skipping`);
      continue;
    }
    const pairs = buildPairs(students);
    for (const pair of pairs) {
      const pairId = `${className}-${weekKey}-${pairIndex}`;
      pairIndex++;
      const pairDocs = generatePairDocs(pair, weekKey);
      for (const doc of pairDocs) {
        doc.data.pairId = pairId;
        allPairDocs.push(doc);
      }
    }
    console.log(`  ${className}: ${students.length} students → ${pairs.length} group(s)`);
  }

  await commitPairings(allPairDocs, accessToken, env);
  await updateUserStrikes(userStrikes, accessToken, env);

  const totalPairs = allPairDocs.filter((d) => !d.uid.endsWith("_extra")).length;
  console.log(`Done! Created ${totalPairs} pairings, skipped ${skippedUsers.length} users.`);

  return {
    success: true,
    week: weekKey,
    pairings: totalPairs,
    eligible: eligibleUsers.length,
    skipped: skippedUsers.length,
  };
}

function getCurrentWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-${String(week).padStart(2, "0")}`;
}

function getPreviousWeekKey() {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-${String(week).padStart(2, "0")}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPairs(students) {
  const shuffled = shuffle(students);
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
  }
  if (shuffled.length % 2 !== 0) {
    const last = shuffled[shuffled.length - 1];
    if (pairs.length > 0) {
      pairs[pairs.length - 1].push(last);
    }
  }
  return pairs;
}

function generatePairDocs(pair, weekKey) {
  const docs = [];
  for (let i = 0; i < pair.length; i++) {
    const buddies = pair.filter((_, j) => j !== i);
    const primaryBuddy = buddies[0];
    docs.push({
      uid: pair[i].uid,
      data: {
        buddy: primaryBuddy.uid,
        buddyName: primaryBuddy.name,
        buddyUsername: primaryBuddy.username || null,
        buddyPhoto: primaryBuddy.photoURL || null,
        buddyClass: primaryBuddy.class,
        week: weekKey,
        class: pair[i].class,
        met: false,
        confirmedBy: [],
        createdAt: new Date().toISOString(),
      },
    });
    if (buddies.length > 1) {
      const secondaryBuddy = buddies[1];
      docs.push({
        uid: `${pair[i].uid}_extra`,
        data: {
          buddy: secondaryBuddy.uid,
          buddyName: secondaryBuddy.name,
          buddyUsername: secondaryBuddy.username || null,
          buddyPhoto: secondaryBuddy.photoURL || null,
          buddyClass: secondaryBuddy.class,
          week: weekKey,
          class: pair[i].class,
          met: false,
          confirmedBy: [],
          createdAt: new Date().toISOString(),
        },
        extra: true,
      });
    }
  }
  return docs;
}

function calculateStrikes(users, prevPairings) {
  const strikes = {};
  const docMap = {};
  for (const p of prevPairings) {
    docMap[p.docUid] = p;
  }

  for (const u of users) {
    const uid = u.uid;
    const myDocs = prevPairings.filter((p) => p.docUid === uid && !p.docUid.endsWith("_extra"));

    let mutualCount = 0;
    for (const myDoc of myDocs) {
      const myConfirmed = (myDoc.confirmedBy || []).includes(uid);
      const buddyDoc = docMap[myDoc.buddy];
      const buddyConfirmed = buddyDoc ? (buddyDoc.confirmedBy || []).includes(myDoc.buddy) : false;
      if (myConfirmed && buddyConfirmed) mutualCount++;
    }

    const hadPairings = myDocs.length > 0;
    const confirmedNone = mutualCount === 0;
    const currentStrikes = u.strikes || 0;

    if (hadPairings && confirmedNone) {
      strikes[uid] = currentStrikes + 1;
    } else if (hadPairings && !confirmedNone) {
      strikes[uid] = 0;
    } else {
      strikes[uid] = currentStrikes;
    }
  }

  return strikes;
}

/* ---- Firestore REST helpers ---- */

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

async function fetchAllUsers(accessToken, env) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map((doc) => {
    const fields = flattenFields(doc.fields);
    return { uid: doc.name.split("/").pop(), ...fields };
  });
}

async function fetchPairingsForWeek(weekKey, accessToken, env) {
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
          from: [{ collectionId: "pairings" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "week" },
              op: "EQUAL",
              value: { stringValue: weekKey },
            },
          },
        },
      }),
    }
  );
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((r) => r.document)
    .map((r) => {
      const doc = r.document;
      const uid = doc.name.split("/").pop();
      const fields = flattenFields(doc.fields);
      return { docUid: uid, uid, ...fields };
    });
}

async function commitPairings(pairDocs, accessToken, env) {
  const writes = pairDocs.map((doc) => ({
    update: {
      name: `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/pairings/${doc.uid}`,
      fields: encodeFields(doc.data),
    },
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writes.slice(i, i + BATCH_SIZE);
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ writes: batch }),
      }
    );
  }
}

async function updateUserStrikes(strikesMap, accessToken, env) {
  const writes = Object.entries(strikesMap).map(([uid, strikes]) => ({
    update: {
      name: `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      fields: {
        strikes: { integerValue: strikes },
      },
      updateMask: { fieldPaths: ["strikes"] },
    },
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writes.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ writes: batch }),
      }
    );
  }
}

/* ---- Firestore field helpers ---- */

function flattenFields(fields) {
  if (!fields) return {};
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.integerValue !== undefined) result[key] = Number(value.integerValue);
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
    else if (value.timestampValue !== undefined) result[key] = value.timestampValue;
    else if (value.nullValue !== undefined) result[key] = null;
    else if (value.arrayValue) {
      result[key] = (value.arrayValue.values || []).map((v) => v.stringValue || v.integerValue);
    }
  }
  return result;
}

function encodeFields(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (typeof value === "number") {
      fields[key] = { integerValue: Math.floor(value) };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) => {
            if (typeof v === "string") return { stringValue: v };
            return { stringValue: String(v) };
          }),
        },
      };
    }
  }
  return fields;
}
