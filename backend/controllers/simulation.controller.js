const axios = require("axios");

exports.runSimulation = async (req, res) => {
    try {
        console.log("Incoming request:", req.body);

        const aiRes = await axios.post(
            "https://gigaurdaiengine.onrender.com/predict",
            req.body
        );

        console.log("AI response:", aiRes.data);

        const ai = aiRes.data;

        res.json({
            success: true,
            zoneRisk: ai.risk,
            premium: ai.premium,
            coverage: ai.coverage
        });

    } catch (err) {
        console.error("🔥 FULL ERROR:", err.response?.data || err.message);

        res.status(500).json({
            error: "AI failed",
            details: err.response?.data || err.message
        });
    }
};