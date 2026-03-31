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