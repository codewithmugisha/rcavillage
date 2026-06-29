import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_PATH = process.argv[2];
if (!SERVICE_ACCOUNT_PATH) {
  console.error("Usage: node scripts/seed.mjs <path-to-service-account.json>");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const PASSWORD = "rca123456";

const FIRST_NAMES = [
  "Jean-Pierre", "Jean-Baptiste", "Jean-Claude", "Jean-Paul", "Jean-Marie",
  "Emmanuel", "Pacifique", "Theogene", "Bonaventure", "Appolinaire",
  "Celestin", "Damascene", "Evariste", "Faustin", "Gaspard",
  "Hilaire", "Innocent", "Leopold", "Modeste", "Narcisse",
  "Patrice", "Rene", "Severin", "Theoneste", "Valens",
  "Yves", "Anicet", "Benjamin", "Christian", "Didier",
  "Eric", "Fabien", "Gael", "Henri", "Ignace",
  "Jacques", "Kenny", "Ladislas", "Michel", "Noel",
  "Olivier", "Pierre", "Raymond", "Samuel", "Thierry",
  "Viateur", "Alain", "Bernard", "Charles", "Daniel",
  "Egide", "Fidele", "Gratien", "Hussein", "Isaac",
  "Jules", "Kevine", "Laurent", "Moses", "Nathan",
  "Patrick", "Rwandan", "Salomon", "Tresor", "Vincent",
  "Alice", "Beatrice", "Carine", "Diane", "Esther",
  "Florence", "Gorette", "Helene", "Ineza", "Joselyne",
  "Keza", "Laetitia", "Marie", "Nancy", "Olive",
  "Prisca", "Rose", "Sandrine", "Tatiana", "Uwera",
  "Valerie", "Yvonne", "Ange", "Belyse", "Chantal",
  "Divine", "Eliane", "France", "Gisele", "Honorine",
  "Isabelle", "Jeannette", "Kami", "Liliane", "Mireille",
];

const LAST_NAMES = [
  "Habarurema", "Niyonzima", "Hakizimana", "Mugisha", "Uwimana",
  "Nshimiyimana", "Bizimana", "Habimana", "Iradukunda", "Manzi",
  "Ndayisaba", "Ngabo", "Niyigena", "Rukundo", "Tuyishime",
  "Uwamariya", "Uwase", "Uwimana", "Yamuremye", "Nkurunziza",
  "Ndiragije", "Mbonimpa", "Mazimpaka", "Karamaga", "Habarugira",
  "Gakuba", "Cyusa", "Bimenyimana", "Barigye", "Sibomana",
  "Nzeyimana", "Mutesi", "Mukagatare", "Mugwaneza", "Mugenzi",
  "Mubiligi", "Mpinganzima", "Nkundabera", "Sendanyoye", "Semakula",
  "Serugendo", "Shyaka", "Sibomana", "Sinamenye", "Twahirwa",
  "Uwayo", "Uwimana", "Uwizeye", "Uwizera", "Yadufashije",
  "Bagirishya", "Bakundukize", "Bamporiki", "Biracyaza", "Gatoto",
  "Gisubizo", "Habyarimana", "Haguma", "Havugimana", "Hitimana",
  "Kabeza", "Kaboneka", "Kamana", "Kanyamugenge", "Karuranga",
  "Kawanga", "Kayitana", "Mbonyumuvunyi", "Mfitumukiza", "Mukamana",
  "Mukandekezi", "Mukankusi", "Mukanyandwi", "Mukarwego", "Mukasakindi",
  "Mukasekuru", "Mukashima", "Mukayitare", "Muneza", "Munyakazi",
  "Munyaneza", "Munyankiko", "Murara", "Murekatete", "Murengerantwari",
  "Musabimana", "Musabyimana", "Musanabera", "Mutabazi", "Mutaganda",
  "Mutarambirwa", "Mutuyimana", "Muvunyi", "Mwenedata", "Ndagijimana",
];

const FUN_FACTS = [
  "Can recite all 54 African countries in under a minute",
  "Once built a PC from scratch at age 12",
  "Speaks 4 languages fluently",
  "Has visited 15 countries",
  "Can solve a Rubik's cube in 45 seconds",
  "Won a national chess tournament",
  "Has run 3 marathons",
  "Can play 5 musical instruments",
  "Wrote a short story published in a magazine",
  "Once cooked for 200 people at a community event",
  "Can name every capital city in the world",
  "Held a solo art exhibition in high school",
  "Can juggle 4 balls at once",
  "Has a twin sibling",
  "Was a national champion in swimming",
  "Can code in 8 programming languages",
  "Once met the President of Rwanda",
  "Can bake professional-level cakes",
  "Has summited Mount Kilimanjaro",
  "Is a black belt in karate and judo",
  "Can play piano by ear",
  "Never had a cup of coffee in their life",
  "Can touch their nose with their tongue",
  "Once appeared on national television",
  "Has a collection of over 100 books",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUsername(firstName, lastName) {
  const base = `${firstName.toLowerCase().replace(/[^a-z]/g, "")}.${lastName.toLowerCase()}`;
  const suffix = Math.random() > 0.7 ? Math.floor(Math.random() * 99) + 1 : "";
  return `${base}${suffix}`;
}

function generateStudent(index) {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const username = generateUsername(firstName, lastName);
  const email = `${username}@rca.app`;
  const classVal = pick(["Y1", "Y2", "Y3"]);
  const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3d3d3d&color=fff&size=200`;

  const github = Math.random() > 0.3 ? `https://github.com/${username}` : null;
  const instagram = Math.random() > 0.5 ? `https://instagram.com/${username}` : null;
  const linkedin = Math.random() > 0.5 ? `https://linkedin.com/in/${username}` : null;

  const funFact = pick(FUN_FACTS);

  return { name, username, email, class: classVal, photoURL, secondaryPhotoURL: null, funFact, github, instagram, linkedin, createdAt: new Date() };
}

async function seed() {
  console.log("Generating 380 students...");
  const students = Array.from({ length: 380 }, (_, i) => generateStudent(i));

  // Deduplicate emails
  const seen = new Set();
  const unique = [];
  for (const s of students) {
    if (!seen.has(s.email)) {
      seen.add(s.email);
      unique.push(s);
    }
  }
  console.log(`Generated ${unique.length} unique students`);

  let created = 0;
  const CONCURRENCY = 10;

  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const chunk = unique.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async (s) => {
        await auth.createUser({
          uid: s.email,
          email: s.email,
          password: PASSWORD,
          displayName: s.name,
        });
        await db.collection("users").doc(s.email).set({
          name: s.name,
          username: s.username,
          email: s.email,
          class: s.class,
          photoURL: s.photoURL,
          secondaryPhotoURL: s.secondaryPhotoURL,
          funFact: s.funFact,
          github: s.github,
          instagram: s.instagram,
          linkedin: s.linkedin,
          createdAt: s.createdAt,
        });
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        created++;
      } else {
        const msg = r.reason?.message || "";
        if (msg.includes("EMAIL_EXISTS") || msg.includes("already-exists")) {
          created++;
        } else {
          console.error("Error:", r.reason);
        }
      }
    }

    const done = Math.min(i + CONCURRENCY, unique.length);
    console.log(`Progress: ${done}/${unique.length} created`);
  }

  console.log(`\nDone! Created ${created} student accounts.`);
  console.log(`Password for all accounts: ${PASSWORD}`);
  console.log(`Example login: use any username@rca.app as email`);
}

seed().catch(console.error);
