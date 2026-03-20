const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const path = require('path');
const { db } = require('./config/firebase');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiter
const limiter = rateLimit({
    windowMs: 1000,
    max: 10,
    message: 'Too many requests, slow down.'
});
app.use('/api/', limiter);

// Health check
app.get('/', (req, res) => {
    res.send('✅ SafeGig Backend Running');
});

// -------------------- AI HELPER --------------------
function runAI(rainfall, delivery_drop, reports, res, callback) {
    const aiScriptPath = path.resolve(__dirname, '../ai/risk_engine.py');

    // ✅ FIX: python → python3
    const command = `python3 "${aiScriptPath}" "{\\"rainfall\\": ${rainfall}, \\"delivery_drop\\": ${delivery_drop}, \\"reports\\": ${reports}}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ AI EXEC ERROR:", error);
            console.error("STDERR:", stderr);
            return res.status(500).json({ error: 'AI engine failed' });
        }

        try {
            const aiOutput = JSON.parse(stdout);
            callback(aiOutput);
        } catch (err) {
            console.error("❌ AI PARSE ERROR:", stdout);
            return res.status(500).json({ error: 'Invalid AI response' });
        }
    });
}

// -------------------- SIMULATION --------------------
app.post('/api/simulation/event', async (req, res) => {
    try {
        const { rainfall, delivery_drop, reports } = req.body;

        runAI(rainfall, delivery_drop, reports, res, async (aiOutput) => {
            const riskScore = aiOutput.risk_score;

            if (db) {
                try {
                    await db.collection('simulation_events').add({
                        rainfall,
                        delivery_drop,
                        reports,
                        riskScore,
                        timestamp: new Date()
                    });
                } catch (e) {
                    console.warn("⚠️ Firebase log failed");
                }
            }

            res.json({ success: true, risk_score: riskScore });
        });

    } catch (err) {
        console.error("SIMULATION ERROR:", err);
        res.status(500).json({ error: 'Simulation failed' });
    }
});

// -------------------- POLICY --------------------
app.post('/api/policy/generate', (req, res) => {
    try {
        const { platform, zone, dailyIncome } = req.body;

        const rainfall = Math.random();
        const delivery_drop = Math.random();
        const reports = Math.random() * 0.5;

        runAI(rainfall, delivery_drop, reports, res, (aiOutput) => {
            let zoneRisk = aiOutput.risk_score;

            if (zoneRisk < 0.55) zoneRisk += 0.35;
            if (zoneRisk > 1.0) zoneRisk = 1.0;

            const weeklyIncome = dailyIncome * 6;

            const premium = (weeklyIncome * 0.02) * zoneRisk;
            const coverage = weeklyIncome * 0.35;

            res.json({
                success: true,
                premium: Math.round(premium),
                coverage: Math.round(coverage),
                zoneRisk,
                platform,
                zone
            });
        });

    } catch (err) {
        console.error("POLICY ERROR:", err);
        res.status(500).json({ error: 'Policy generation failed' });
    }
});

app.post('/api/policy/activate', async (req, res) => {
    try {
        const { userId, platform, zone, premium, coverage } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId required" });
        }

        const policyData = {
            userId,
            platform,
            zone,
            premium,
            coverage,
            status: 'active',
            createdAt: new Date()
        };

        if (db) {
            await db.collection('policies').doc(userId).set(policyData);
        }

        res.json({ success: true, policy: policyData });

    } catch (err) {
        console.error("ACTIVATE ERROR:", err);
        res.status(500).json({ error: 'Activation failed' });
    }
});

// -------------------- AUTH --------------------
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, phone, platform, zone, income, password } = req.body;

        const userId = "user_" + Date.now();

        if (db) {
            await db.collection('users').doc(userId).set({
                name, phone, platform, zone, income, password
            });
        }

        res.json({ success: true, userId, name });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (db) {
            const snapshot = await db.collection('users')
                .where('phone', '==', email).get();

            if (snapshot.empty) {
                return res.status(401).json({ error: 'User not found' });
            }

            let user = null;
            let userId = null;

            snapshot.forEach(doc => {
                if (doc.data().password === password) {
                    user = doc.data();
                    userId = doc.id;
                }
            });

            if (!user) {
                return res.status(401).json({ error: 'Incorrect password' });
            }

            return res.json({
                success: true,
                userId,
                name: user.name,
                user
            });
        }

        // fallback
        res.json({
            success: true,
            userId: "demo",
            name: "Demo User"
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// -------------------- WALLET --------------------
app.post('/api/wallet/credit', async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!db) {
            return res.json({ success: true, amount });
        }

        const ref = db.collection('wallets').doc(userId);
        const doc = await ref.get();

        let balance = 0;
        let history = [];

        if (doc.exists) {
            const data = doc.data();
            balance = data.balance || 0;
            history = data.history || [];
        }

        balance += amount;
        history.unshift({ amount, date: new Date() });

        await ref.set({ balance, history });

        res.json({ success: true, balance });

    } catch (err) {
        console.error("WALLET ERROR:", err);
        res.status(500).json({ error: 'Wallet failed' });
    }
});

// -------------------- START --------------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});