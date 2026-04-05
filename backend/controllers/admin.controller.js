const { db } = require('../config/firebase');

/**
 * Get overall system statistics for Admin Dashboard
 * Returns counts of users, policies, reports, and simulations
 */
exports.getStats = async (req, res) => {
    try {
        // We use Firestore's count() aggregation for efficiency
        const usersCount = (await db.collection('users').count().get()).data().count;
        const policiesCount = (await db.collection('policies').count().get()).data().count;
        const reportsCount = (await db.collection('reports').count().get()).data().count;
        const simulationsCount = (await db.collection('simulations').count().get()).data().count;

        res.json({
            success: true,
            stats: {
                totalUsers: usersCount,
                totalPolicies: policiesCount,
                totalReports: reportsCount,
                totalSimulations: simulationsCount
            }
        });

    } catch (err) {
        console.error("ADMIN STATS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
};
