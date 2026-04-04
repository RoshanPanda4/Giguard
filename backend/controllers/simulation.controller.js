const axios = require("axios");

const AI_ENGINE_URL = "https://gigaurdaiengine.onrender.com/predict";

exports.runSimulation = async (req, res) => {
    try {
        console.log("📡 Incoming simulation request:", req.body);

        const aiRes = await axios.post(AI_ENGINE_URL, req.body, {
            timeout: 30000 // 30s timeout for Render cold starts
        });

        console.log("✅ AI Engine response:", aiRes.data);

        // Forward the FULL AI response to frontend
        // AI returns: { success, risk, fraud, events, premium, coverage, claim, explanation }
        res.json(aiRes.data);

    } catch (err) {
        console.error("🔥 AI Engine Error:", err.response?.data || err.message);

        res.status(500).json({
            error: "AI Engine failed",
            details: err.response?.data || err.message
        });
    }
};

const { db } = require('../config/firebase');

exports.saveResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resultData = req.body;

        await db.collection('simulations').doc(userId).set({
            ...resultData,
            updatedAt: new Date()
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
        const doc = await db.collection('simulations').doc(userId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "No simulation result found" });
        }

        res.json({ success: true, result: doc.data() });
    } catch (err) {
        console.error("GET RESULT ERROR:", err);
        res.status(500).json({ error: "Failed to get simulation result" });
    }
};