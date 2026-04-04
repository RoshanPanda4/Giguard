const { db } = require('../config/firebase');

/**
 * Save a new emergency report
 */
exports.addReport = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { zone, disasterType } = req.body;

        if (!zone || !disasterType) {
            return res.status(400).json({ error: "Zone and disaster type required" });
        }

        const reportData = {
            userId,
            zone,
            disasterType,
            timestamp: new Date()
        };

        await db.collection('reports').add(reportData);

        res.json({ success: true, message: "Emergency report submitted" });
    } catch (err) {
        console.error("ADD REPORT ERROR:", err);
        res.status(500).json({ error: "Failed to submit report" });
    }
};

/**
 * Aggregate reports in a specific zone to determine the risk status
 */
exports.getZoneRiskStatus = async (req, res) => {
    try {
        const zone = req.params.zone;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const snapshot = await db.collection('reports')
            .where('zone', '==', zone)
            .where('timestamp', '>=', oneHourAgo)
            .get();

        const reportCount = snapshot.size;

        let status = "LOW";
        if (reportCount >= 6) status = "DANGER";
        else if (reportCount >= 3) status = "MEDIUM";

        res.json({
            success: true,
            zone,
            status,
            reportCount,
            timestamp: new Date()
        });
    } catch (err) {
        console.error("GET ZONE RISK ERROR:", err);
        res.status(500).json({ error: "Failed to calculate zone risk" });
    }
};
