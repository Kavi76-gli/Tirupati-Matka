const {
    initializeApp,
    getApps,
    cert
} = require("firebase-admin/app");

const {
    getAuth
} = require("firebase-admin/auth");

// ======================================================
// FIREBASE ADMIN CONFIGURATION
// ======================================================
const projectId = process.env.FIREBASE_PROJECT_ID;

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : null;

// ======================================================
// CHECK ENVIRONMENT VARIABLES
// ======================================================

if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
        "Firebase Admin configuration is missing. " +
        "Please configure FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env / Render."
    );
}

// ======================================================
// INITIALIZE FIREBASE
// ======================================================

let firebaseApp;

if (getApps().length === 0) {

    firebaseApp = initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey
        })
    });

    console.log("✅ Firebase Admin initialized");

} else {

    firebaseApp = getApps()[0];

    console.log("✅ Firebase Admin already initialized");
}

// ======================================================
// FIREBASE AUTH
// ======================================================

const firebaseAuth = getAuth(firebaseApp);

// ======================================================
// EXPORT
// ======================================================

module.exports = {
    firebaseApp,
    firebaseAuth
};