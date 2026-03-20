const admin = require('firebase-admin');
require('dotenv').config();

// To run this locally, the user will need to place their Firebase service account JSON key in the backend folder
// or provide the path via GOOGLE_APPLICATION_CREDENTIALS in the .env file.
// For development without the file, we wrap in a try-catch to avoid crashing immediately.

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized successfully.");
    } else {
        console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_PATH not found in .env.");
        console.log("To connect to a real database, add your Firebase Service Account JSON file and update .env");
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error.message);
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };
