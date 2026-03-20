const admin = require('firebase-admin');
const path = require('path');

// 🔥 HARDCODE PATH (for debugging)
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

console.log("✅ Firebase Admin using service account:", serviceAccount.project_id);

module.exports = { db };