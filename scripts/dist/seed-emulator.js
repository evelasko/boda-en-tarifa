#!/usr/bin/env tsx
import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore, } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
const DEFAULT_PROJECT_ID = "demo-boda-en-tarifa";
const DEFAULT_PASSWORD = "Test1234!";
const AUTH_USERS = [
    {
        uid: "seed_admin_001",
        email: "admin.one@example.test",
        displayName: "Admin One",
        claims: { authorized: true, admin: true },
    },
    {
        uid: "seed_guest_001",
        email: "ana.mar@example.test",
        displayName: "Ana del Mar",
        claims: { authorized: true },
    },
    {
        uid: "seed_guest_002",
        email: "luis.rio@example.test",
        displayName: "Luis del Rio",
        claims: { authorized: true },
    },
    {
        uid: "seed_guest_003",
        email: "marta.sol@example.test",
        displayName: "Marta Sol",
        claims: { authorized: true },
    },
    {
        uid: "seed_guest_004",
        email: "pablo.luz@example.test",
        displayName: "Pablo Luz",
        claims: { authorized: true },
    },
    {
        uid: "seed_guest_unclaimed_001",
        email: "sofia.pending@example.test",
        displayName: "Sofia Pending",
        claims: { authorized: false },
    },
    {
        uid: "seed_orphan_001",
        email: "orphan.user@example.test",
        displayName: "Orphan User",
        claims: { authorized: false },
    },
];
function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function parseProjectId(args) {
    const flagIndex = args.indexOf("--project");
    if (flagIndex !== -1) {
        const fromFlag = args[flagIndex + 1];
        if (!fromFlag) {
            throw new Error("The --project flag requires a value.");
        }
        return fromFlag;
    }
    return process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
}
function parseIncludeMigrationCase(args) {
    return args.includes("--include-migration-case");
}
function initAdmin(projectId) {
    if (getApps().length > 0)
        return;
    initializeApp({ projectId });
}
function nowServerTimestamps() {
    return {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
}
function buildGuests(includeMigrationCase) {
    const common = nowServerTimestamps();
    const baseGuests = {
        seed_admin_001: {
            email: "admin.one@example.test",
            fullName: "Admin One",
            relationToGrooms: "Amigo de ambos",
            relationshipStatus: "enPareja",
            side: "ambos",
            profileClaimed: true,
            isDirectoryVisible: true,
            contactPreference: "email",
            whatsappNumber: "34600111001",
            funFact: "Organiza playlists para cualquier evento.",
            ...common,
        },
        seed_guest_001: {
            email: "ana.mar@example.test",
            fullName: "Ana del Mar",
            relationToGrooms: "Amiga de Novio A",
            relationshipStatus: "soltero",
            side: "novioA",
            profileClaimed: true,
            isDirectoryVisible: true,
            contactPreference: "whatsapp",
            whatsappNumber: "34600111002",
            ...common,
        },
        seed_guest_002: {
            email: "luis.rio@example.test",
            fullName: "Luis del Rio",
            relationToGrooms: "Primo de Novio B",
            relationshipStatus: "enPareja",
            side: "novioB",
            profileClaimed: true,
            isDirectoryVisible: true,
            contactPreference: "email",
            ...common,
        },
        seed_guest_003: {
            email: "marta.sol@example.test",
            fullName: "Marta Sol",
            relationToGrooms: "Amiga de ambos",
            relationshipStatus: "buscando",
            side: "ambos",
            profileClaimed: true,
            isDirectoryVisible: false,
            contactPreference: "whatsapp",
            ...common,
        },
        seed_guest_004: {
            email: "pablo.luz@example.test",
            fullName: "Pablo Luz",
            relationToGrooms: "Companero de trabajo de Novio A",
            relationshipStatus: "soltero",
            side: "novioA",
            profileClaimed: true,
            isDirectoryVisible: true,
            ...common,
        },
        seed_guest_unclaimed_001: {
            email: "sofia.pending@example.test",
            fullName: "Sofia Pending",
            relationToGrooms: "Amiga de Novio B",
            relationshipStatus: "enPareja",
            side: "novioB",
            profileClaimed: false,
            isDirectoryVisible: true,
            ...common,
        },
    };
    if (includeMigrationCase) {
        baseGuests.seed_legacy_guest_doc_001 = {
            email: "migrated.user@example.test",
            fullName: "Migrated Legacy User",
            relationToGrooms: "Amigo de Novio B",
            relationshipStatus: "soltero",
            side: "novioB",
            profileClaimed: false,
            isDirectoryVisible: true,
            ...common,
        };
    }
    return baseGuests;
}
function buildSeating() {
    return {
        seed_guest_001: { tableName: "Mesa Estrecho", seatNumber: 3 },
        seed_guest_002: { tableName: "Mesa Levante", seatNumber: 6 },
        seed_guest_003: { tableName: "Mesa Poniente", seatNumber: 2 },
    };
}
function buildTimeGatedContent() {
    return {
        cocktail_menu: {
            title: "Carta de Cocteles",
            type: "cocktailMenu",
            unlockAt: Timestamp.fromDate(new Date("2026-05-30T17:30:00Z")),
            content: {
                categories: [
                    {
                        name: "Signature",
                        items: ["Tarifa Sunset", "Buganvilla Spritz"],
                    },
                ],
            },
        },
        seating_chart: {
            title: "Plano de Mesas",
            type: "seatingChart",
            unlockAt: Timestamp.fromDate(new Date("2026-05-30T17:30:00Z")),
            content: {
                totalTables: 12,
                floorPlanUrl: "https://res.cloudinary.com/demo/image/upload/v1/seed/floor-plan.png",
            },
        },
        banquet_menu: {
            title: "Menu del Banquete",
            type: "banquetMenu",
            unlockAt: Timestamp.fromDate(new Date("2026-05-30T20:00:00Z")),
            content: {
                courses: [
                    {
                        name: "Entrante",
                        dishes: ["Tartar de atun", "Ensalada citrica"],
                    },
                ],
            },
        },
    };
}
function buildFeedPosts() {
    const authors = ["seed_guest_001", "seed_guest_002", "seed_guest_003"];
    const sources = ["unfiltered", "import", "share_extension"];
    const baseTime = new Date("2026-05-30T18:00:00Z").getTime();
    const hiddenIds = new Set(["seed_post_005", "seed_post_011"]);
    const posts = {};
    for (let i = 1; i <= 12; i++) {
        const id = `seed_post_${String(i).padStart(3, "0")}`;
        const authorUid = authors[(i - 1) % authors.length];
        const source = sources[(i - 1) % sources.length];
        const createdAt = Timestamp.fromMillis(baseTime - (i - 1) * 5 * 60 * 1000);
        const includeCaption = i % 3 !== 0;
        posts[id] = {
            authorUid,
            authorName: authorUid === "seed_guest_001" ?
                "Ana del Mar" : authorUid === "seed_guest_002" ?
                "Luis del Rio" :
                "Marta Sol",
            authorPhotoUrl: `seed/avatars/${authorUid}`,
            imageUrls: [`seed/feed/${String(i).padStart(3, "0")}`],
            caption: includeCaption ? `Seed feed post ${i}` : "",
            source,
            isHidden: hiddenIds.has(id),
            createdAt,
        };
    }
    return posts;
}
function buildNotices() {
    const authors = [
        {
            uid: "seed_guest_001",
            name: "Ana del Mar",
            photo: "seed/avatars/seed_guest_001",
            whatsapp: "34600111002",
        },
        {
            uid: "seed_guest_002",
            name: "Luis del Rio",
            photo: "seed/avatars/seed_guest_002",
            whatsapp: "34600111003",
        },
        {
            uid: "seed_guest_003",
            name: "Marta Sol",
            photo: "seed/avatars/seed_guest_003",
            whatsapp: "34600111004",
        },
    ];
    const baseTime = new Date("2026-05-30T16:00:00Z").getTime();
    const notices = {};
    for (let i = 1; i <= 8; i++) {
        const id = `seed_notice_${String(i).padStart(3, "0")}`;
        const author = authors[(i - 1) % authors.length];
        notices[id] = {
            authorUid: author.uid,
            authorName: author.name,
            authorPhotoUrl: author.photo,
            authorWhatsappNumber: author.whatsapp,
            body: `Aviso de prueba ${i}: nos vemos en el siguiente evento.`,
            createdAt: Timestamp.fromMillis(baseTime - (i - 1) * 10 * 60 * 1000),
        };
    }
    return notices;
}
function buildSentNotifications() {
    return {
        welcome_party_reminder: {
            sentAt: "2026-05-29T17:05:00.000Z",
            type: "event_reminder",
            eventId: "welcome_party",
        },
    };
}
function buildRsvpResponses() {
    const base = {
        submittedAt: Timestamp.fromDate(new Date("2026-05-20T12:00:00Z")),
        updatedAt: Timestamp.fromDate(new Date("2026-05-20T12:00:00Z")),
    };
    return {
        seed_guest_001: {
            ...base,
            userEmail: "ana.mar@example.test",
            userDisplayName: "Ana del Mar",
            isSubmitted: true,
            responses: {
                attendance: "yes",
                accommodationManagement: "yes",
                nightsStaying: ["friday", "saturday"],
                roomSharing: "Nadie",
                transportationNeeds: ["find_ride"],
                mainCoursePreference: "fish",
            },
        },
        seed_guest_002: {
            ...base,
            userEmail: "luis.rio@example.test",
            userDisplayName: "Luis del Rio",
            isSubmitted: true,
            responses: {
                attendance: "no",
                accommodationManagement: "no",
                nightsStaying: [],
                roomSharing: "",
                transportationNeeds: [],
                mainCoursePreference: "vegetarian",
            },
        },
        seed_guest_003: {
            ...base,
            userEmail: "marta.sol@example.test",
            userDisplayName: "Marta Sol",
            isSubmitted: false,
            responses: {
                attendance: "yes",
            },
        },
    };
}
async function upsertCollection(collectionName, records) {
    const db = getFirestore();
    const entries = Object.entries(records);
    if (entries.length === 0)
        return 0;
    const chunkSize = 400;
    for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const batch = db.batch();
        for (const [id, data] of chunk) {
            batch.set(db.collection(collectionName).doc(id), data, { merge: true });
        }
        await batch.commit();
    }
    return entries.length;
}
async function upsertAuthUsers(users) {
    const auth = getAuth();
    let count = 0;
    for (const user of users) {
        try {
            await auth.getUser(user.uid);
            await auth.updateUser(user.uid, {
                email: user.email,
                displayName: user.displayName,
                password: DEFAULT_PASSWORD,
                emailVerified: true,
            });
        }
        catch (error) {
            const code = error.code;
            if (code === "auth/user-not-found") {
                await auth.createUser({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    password: DEFAULT_PASSWORD,
                    emailVerified: true,
                });
            }
            else {
                throw error;
            }
        }
        await auth.setCustomUserClaims(user.uid, user.claims);
        count++;
    }
    return count;
}
async function main() {
    const args = process.argv.slice(2);
    const includeMigrationCase = parseIncludeMigrationCase(args);
    const includeRsvp = args.includes("--include-rsvp");
    const projectId = parseProjectId(args);
    const firestoreHost = requireEnv("FIRESTORE_EMULATOR_HOST");
    const authHost = requireEnv("FIREBASE_AUTH_EMULATOR_HOST");
    console.log(`Seeding Firebase emulators for project: ${projectId}`);
    console.log(`Firestore emulator host: ${firestoreHost}`);
    console.log(`Auth emulator host: ${authHost}`);
    initAdmin(projectId);
    const usersSeeded = await upsertAuthUsers(AUTH_USERS);
    const guestsSeeded = await upsertCollection("guests", buildGuests(includeMigrationCase));
    const seatingSeeded = await upsertCollection("seating", buildSeating());
    const timeGatedSeeded = await upsertCollection("time_gated_content", buildTimeGatedContent());
    const postsSeeded = await upsertCollection("feed_posts", buildFeedPosts());
    const noticesSeeded = await upsertCollection("notices", buildNotices());
    const sentNotificationsSeeded = await upsertCollection("sent_notifications", buildSentNotifications());
    let rsvpSeeded = 0;
    if (includeRsvp) {
        rsvpSeeded = await upsertCollection("rsvp_responses", buildRsvpResponses());
    }
    if (includeMigrationCase) {
        const auth = getAuth();
        try {
            await auth.getUser("seed_migrated_001");
        }
        catch (error) {
            const code = error.code;
            if (code === "auth/user-not-found") {
                await auth.createUser({
                    uid: "seed_migrated_001",
                    email: "migrated.user@example.test",
                    displayName: "Migrated User",
                    password: DEFAULT_PASSWORD,
                    emailVerified: true,
                });
            }
            else {
                throw error;
            }
        }
        await auth.setCustomUserClaims("seed_migrated_001", { authorized: true });
    }
    console.log("\nSeed complete:");
    console.log(`- Auth users: ${usersSeeded}`);
    console.log(`- guests: ${guestsSeeded}`);
    console.log(`- seating: ${seatingSeeded}`);
    console.log(`- time_gated_content: ${timeGatedSeeded}`);
    console.log(`- feed_posts: ${postsSeeded}`);
    console.log(`- notices: ${noticesSeeded}`);
    console.log(`- sent_notifications: ${sentNotificationsSeeded}`);
    console.log(`- rsvp_responses: ${rsvpSeeded}${includeRsvp ? "" : " (skipped)"}`);
    console.log(`- migration case: ${includeMigrationCase ? "included" : "skipped"}`);
}
main().catch((error) => {
    console.error("Failed to seed emulators.");
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
});
//# sourceMappingURL=seed-emulator.js.map