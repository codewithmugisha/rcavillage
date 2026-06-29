import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_PATH = process.argv[2];
if (!SERVICE_ACCOUNT_PATH) {
  console.error("Usage: node scripts/pair.mjs <path-to-service-account.json>");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function getCurrentWeekKey() {
  const now = new Date();
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
        createdAt: new Date(),
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
          createdAt: new Date(),
        },
        extra: true,
      });
    }
  }
  return docs;
}

async function pair() {
  const weekKey = getCurrentWeekKey();
  console.log(`\nGenerating pairings for week ${weekKey}...`);

  const snapshot = await db.collection("users").get();
  const allUsers = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));
  console.log(`Found ${allUsers.length} users`);

  const byClass = {};
  for (const u of allUsers) {
    const c = u.class || "Unknown";
    if (!byClass[c]) byClass[c] = [];
    byClass[c].push(u);
  }

  let totalPairs = 0;
  let pairIndex = 0;
  const batch = db.batch();

  for (const [className, students] of Object.entries(byClass)) {
    if (students.length < 2) {
      console.log(`  ${className}: only ${students.length} student(s), skipping`);
      continue;
    }

    const pairs = buildPairs(students);

    for (const pair of pairs) {
      const pairId = `${className}-${weekKey}-${pairIndex}`;
      pairIndex++;
      const pairDocs = generatePairDocs(pair, weekKey);
      for (const doc of pairDocs) {
        doc.data.pairId = pairId;
        const ref = db.collection("pairings").doc(doc.uid);
        batch.set(ref, doc.data, { merge: true });
        if (!doc.extra) totalPairs++;
      }
    }

    console.log(`  ${className}: ${students.length} students → ${pairs.length} group(s)`);
  }

  await batch.commit();
  console.log(`\nDone! Created ${totalPairs} pairings for week ${weekKey}.`);
  console.log("Run this script each week to generate new pairings.");
}

pair().catch(console.error);
