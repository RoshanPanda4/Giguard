const { db } = require('../config/firebase');

exports.createPolicy = async (req, res) => {
    try {
        const { coverage, premium, zone, platform } = req.body;

        const policy = {
            userId: req.user.userId,
            coverage,
            premium,
            zone,
            platform,
            status: "active",
            createdAt: new Date()
        };

        await db.collection('policies').add(policy);

        res.json({ success: true, policy });

    } catch {
        res.status(500).json({ error: "Policy creation failed" });
    }
};

exports.getPolicy = async (req, res) => {
    const snapshot = await db.collection('policies')
        .where('userId', '==', req.user.userId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return res.json({ success: false });
    }

    res.json({ success: true, policy: snapshot.docs[0].data() });
};

exports.savePendingPolicy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const policyData = req.body;

        await db.collection('pending_policies').doc(userId).set({
            ...policyData,
            updatedAt: new Date()
        });

        res.json({ success: true, message: "Pending policy saved" });
    } catch (err) {
        console.error("SAVE PENDING POLICY ERROR:", err);
        res.status(500).json({ error: "Failed to save pending policy" });
    }
};

exports.getPendingPolicy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const doc = await db.collection('pending_policies').doc(userId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "No pending policy found" });
        }

        res.json({ success: true, pendingPolicy: doc.data() });
    } catch (err) {
        console.error("GET PENDING POLICY ERROR:", err);
        res.status(500).json({ error: "Failed to get pending policy" });
    }
};

exports.activatePolicy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { paymentMethod } = req.body;

        // Get the pending policy
        const doc = await db.collection('pending_policies').doc(userId).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "No pending policy found to activate" });
        }

        const pendingPolicyData = doc.data();

        // Create the actual policy
        const policy = {
            userId: userId,
            coverage: pendingPolicyData.coverage,
            premium: pendingPolicyData.premium,
            zone: pendingPolicyData.zone,
            platform: pendingPolicyData.platform,
            paymentMethod: paymentMethod,
            status: "active",
            createdAt: new Date()
        };

        await db.collection('policies').add(policy);

        // Delete pending
        await db.collection('pending_policies').doc(userId).delete();

        res.json({ success: true, policy });

    } catch (err) {
        console.error("ACTIVATE POLICY ERROR:", err);
        res.status(500).json({ error: "Policy activation failed" });
    }
};