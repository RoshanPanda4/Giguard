const admin = require('firebase-admin');

let serviceAccount;

if (process.env.FIREBASE_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
} else {
    serviceAccount = require('./serviceAccountKey.json'); // local fallback
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log("✅ Firebase Admin using project:", serviceAccount.project_id);

module.exports = { db };