const axios = require("axios");
const { db } = require('../config/firebase');

const AI_ENGINE_URL = "https://gigaurdaiengine.onrender.com/predict";

exports.runSimulation = async (req, res) => {
    try {
        console.log("📡 Incoming simulation request:", req.body);
        const { zone } = req.body;

        // --- FEATURE 4: REPORT -> AI INTEGRATION ---
        let reportCount = 0;
        if (zone) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const snapshot = await db.collection('reports')
                .where('zone', '==', zone)
                .get();
            
            const relevantReports = snapshot.docs.filter(doc => {
                const data = doc.data();
                return data.timestamp && data.timestamp.toDate() >= oneHourAgo;
            });
            reportCount = relevantReports.length;
        }

        const payload = {
            ...req.body,
            reports: reportCount
        };

        const aiRes = await axios.post(AI_ENGINE_URL, payload, {
            timeout: 30000 
        });

        let aiData = aiRes.data;
        console.log("✅ AI Engine response:", aiData);

        // --- FEATURE 4: FRAUD PROTECTION ---
        if (aiData.fraud === true) {
            if (!aiData.claim) aiData.claim = {};
            aiData.claim.approved = false;
            aiData.claim.reason = "Fraud detected by system";
        }

        // --- FEATURE 3: AI RESPONSE ENHANCEMENT ---
        aiData.explanation = {
            factors: [
                { name: "Rain", impact: aiData.risk_factors?.rain || (aiData.risk > 0.5 ? 40 : 10) },
                { name: "Delivery Drop", impact: aiData.risk_factors?.delivery_drop || (aiData.risk > 0.7 ? 50 : 15) },
                { name: "Reports", impact: reportCount * 10 },
                { name: "Surge", impact: aiData.risk_factors?.surge || (aiData.risk > 0.4 ? 30 : 5) }
            ]
        };

        // Forward the FULL AI response to frontend
        res.json(aiData);

    } catch (err) {
        console.error("🔥 AI Engine Error:", err.response?.data || err.message);

        res.status(500).json({
            error: "AI Engine failed",
            details: err.response?.data || err.message
        });
    }
};

exports.saveResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resultData = req.body;

        // --- FEATURE 8: FIX SIMULATION STORAGE ---
        await db.collection('simulations').add({
            userId,
            ...resultData,
            createdAt: new Date()
        });

        res.json({ success: true, message: "Simulation result saved" });
    } catch (err) {
        console.error("SAVE RESULT ERROR:", err);
        res.status(500).json({ error: "Failed to save simulation result" });
    }
};

exports.getResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const snapshot = await db.collection('simulations')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            return res.status(404).json({ error: "No simulation result found" });
        }

        res.json({ success: true, result: snapshot.docs[0].data() });
    } catch (err) {
        console.error("GET RESULT ERROR:", err);
        res.status(500).json({ error: "Failed to get simulation result" });
    }
};