const { db } = require('../config/firebase');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const userData = userDoc.data();
        // Send back profile fields that might be used across simulations
        res.json({
            success: true,
            profile: {
                name: userData.name || '',
                phone: userData.phone || '',
                platform: userData.platform || 'Blinkit',
                zone: userData.zone || 'Patia',
                income: userData.income || 1200,
                photo: userData.photo || ''
            }
        });
    } catch (err) {
        console.error("GET PROFILE ERROR:", err);
        res.status(500).json({ error: "Failed to get profile" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { platform, zone, income, photo } = req.body;
        
        const updates = {};
        if (platform !== undefined) updates.platform = platform;
        if (zone !== undefined) updates.zone = zone;
        if (income !== undefined) updates.income = parseFloat(income) || 1200;
        if (photo !== undefined) updates.photo = photo;

        await db.collection('users').doc(userId).update(updates);
        
        res.json({ success: true, message: "Profile updated" });
    } catch (err) {
        console.error("UPDATE PROFILE ERROR:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
