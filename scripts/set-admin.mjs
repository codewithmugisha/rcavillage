import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_PATH = process.argv[2];
const TARGET_UID = process.argv[3];

if (!SERVICE_ACCOUNT_PATH || !TARGET_UID) {
  console.error("Usage: node scripts/set-admin.mjs <path-to-service-account.json> <uid|email>");
  console.error("  uid can be a Firebase Auth UID or the Firestore doc ID of the user.");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function setAdmin() {
  const ref = db.collection("users").doc(TARGET_UID);
  const snap = await ref.get();

  if (!snap.exists) {
    console.error(`User "${TARGET_UID}" not found in Firestore.`);
    process.exit(1);
  }

  await ref.update({ admin: true });
  console.log(`\nAdmin role granted to ${snap.data().name || TARGET_UID}`);
  console.log("You can now access /admin in the app.\n");
}

setAdmin().catch(console.error);
