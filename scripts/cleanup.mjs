import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_PATH = process.argv[2];
if (!SERVICE_ACCOUNT_PATH) {
  console.error("Usage: node scripts/cleanup.mjs <path-to-service-account.json>");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

async function deleteAllAuthUsers() {
  console.log("Deleting all Firebase Auth users...");
  let deleted = 0;
  let pageToken;
  do {
    const { users, pageToken: nextToken } = await auth.listUsers(1000, pageToken);
    pageToken = nextToken;
    if (users.length === 0) break;
    const uids = users.map((u) => u.uid);
    await auth.deleteUsers(uids);
    deleted += uids.length;
    console.log(`  Deleted ${uids.length} users (total: ${deleted})`);
  } while (pageToken);
  console.log(`Done. Deleted ${deleted} Auth users.`);
}

async function deleteAllFirestoreDocs() {
  console.log("Deleting all Firestore documents...");
  const usersRef = db.collection("users");
  let deleted = 0;
  const batchSize = 200;

  while (true) {
    const snapshot = await usersRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
    console.log(`  Deleted ${snapshot.size} docs (total: ${deleted})`);
  }
  console.log(`Done. Deleted ${deleted} Firestore docs.`);
}

async function cleanup() {
  console.log("=== Starting cleanup ===\n");
  await deleteAllFirestoreDocs();
  console.log();
  await deleteAllAuthUsers();
  console.log("\n=== Cleanup complete ===");
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
