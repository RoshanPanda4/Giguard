const { callAI } = require('../utils/apiClient');

exports.runSimulation = async (req, res) => {
    try {
        const data = await callAI(req.body);
        res.json(data);
    } catch {
        res.status(500).json({ error: "AI failed" });
    }
};