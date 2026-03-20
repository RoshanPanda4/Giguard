const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const path = require('path');
const { db } = require('./config/firebase');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate Limiter: Max 10 requests per second per IP
const limiter = rateLimit({
    windowMs: 1000, 
    max: 10,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// --------------------------------------------------------------------
// AI Simulation Endpoint
// --------------------------------------------------------------------
app.post('/api/simulation/event', async (req, res) => {
    const { rainfall, delivery_drop, reports } = req.body;

    const aiScriptPath = path.resolve(__dirname, '../ai/risk_engine.py');
    const command = `python "${aiScriptPath}" "{\\"rainfall\\": ${rainfall}, \\"delivery_drop\\": ${delivery_drop}, \\"reports\\": ${reports}}"`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`AI Exec Error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to run AI risk engine' });
        }
        
        try {
            const aiOutput = JSON.parse(stdout);
            const riskScore = aiOutput.risk_score;

            // Optional: Log the event to Firebase if connected
            if (db) {
                await db.collection('simulation_events').add({
                    rainfall,
                    delivery_drop,
                    reports,
                    riskScore,
                    timestamp: new Date()
                });
            }

            res.json({ success: true, risk_score: riskScore });
        } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            res.status(500).json({ error: 'Invalid response from AI engine' });
        }
    });
});

// --------------------------------------------------------------------
// Policy Endpoints
// --------------------------------------------------------------------
app.post('/api/policy/generate', (req, res) => {
    const { platform, zone, dailyIncome, workHours } = req.body;
    
    // Simulating live fetched conditions for the provided 'zone'
    const currentRainfall = Math.random(); 
    const currentDeliveryDrop = Math.random(); 
    const currentReports = Math.random() * 0.5; 
    
    const aiScriptPath = path.resolve(__dirname, '../ai/risk_engine.py');
    const command = `python "${aiScriptPath}" "{\\"rainfall\\": ${currentRainfall}, \\"delivery_drop\\": ${currentDeliveryDrop}, \\"reports\\": ${currentReports}}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`AI Exec Error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to run AI risk engine' });
        }
        
        try {
            const aiOutput = JSON.parse(stdout);
            
            // AI generated risk score 0.0 - 1.0
            let zoneRisk = aiOutput.risk_score;
            // Floor adjustment for realistic baseline pricing so premiums never drop artificially to 0
            if (zoneRisk < 0.55) zoneRisk += 0.35; 
            if (zoneRisk > 1.0) zoneRisk = 1.0;
            
            const weeklyIncome = dailyIncome * 6;
            
            // Premium & Coverage Formula leveraging dynamic AI risk
            const premium = (weeklyIncome * 0.02) * zoneRisk;
            const coverage = weeklyIncome * 0.35;

            return res.json({
                success: true,
                premium: Math.round(premium),
                coverage: Math.round(coverage),
                zoneRisk: zoneRisk,
                platform,
                zone
            });
        } catch (parseError) {
            console.error('Failed to parse Python output:', stdout);
            return res.status(500).json({ error: 'Invalid AI response' });
        }
    });
});
app.post('/api/policy/activate', async (req, res) => {
    const { userId, platform, zone, premium, coverage, paymentMethod } = req.body;

    if (!userId) return res.status(400).json({ error: "userId is required" });

    const policyData = {
        userId,
        platform,
        zone,
        premium,
        coverage,
        paymentMethod,
        status: 'active',
        createdAt: new Date(),
        renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    if (db) {
        try {
            await db.collection('policies').doc(userId).set(policyData);
            return res.json({ success: true, message: 'Policy activated and saved to Firebase', policy: policyData });
        } catch (error) {
            console.error('Firebase save error:', error);
            return res.status(500).json({ error: 'Database save failed' });
        }
    } else {
        // Mock fallback if FB is not configured
        return res.json({ success: true, message: 'Mock activation (Firebase not configured)', policy: policyData });
    }
});

app.get('/api/policy/:userId', async (req, res) => {
    const { userId } = req.params;

    if (db) {
        try {
            const doc = await db.collection('policies').doc(userId).get();
            if (!doc.exists) {
                return res.status(404).json({ error: 'No active policy found' });
            }
            return res.json({ success: true, policy: doc.data() });
        } catch (error) {
            return res.status(500).json({ error: 'Database fetch failed' });
        }
    } else {
        // Mock fallback wrapper
        return res.status(404).json({ error: "Firebase DB not connected" });
    }
});

// --------------------------------------------------------------------
// Wallet Endpoints
// --------------------------------------------------------------------
app.get('/api/wallet/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!db) return res.json({ success: true, balance: 430, history: [] }); // Mock

    try {
        const doc = await db.collection('wallets').doc(userId).get();
        if (!doc.exists) return res.json({ success: true, balance: 0, history: [] });
        return res.json({ success: true, ...doc.data() });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch wallet' });
    }
});

app.post('/api/wallet/credit', async (req, res) => {
    const { userId, amount, reason } = req.body;
    if (!db) return res.json({ success: true, amount, message: "Mock credited" }); 

    try {
        const walletRef = db.collection('wallets').doc(userId);
        const doc = await walletRef.get();
        let currentBalance = 0;
        let history = [];

        if (doc.exists) {
            const data = doc.data();
            currentBalance = data.balance || 0;
            history = data.history || [];
        }

        const newBalance = currentBalance + amount;
        history.unshift({ amount, reason, date: new Date() });

        await walletRef.set({ balance: newBalance, history });
        return res.json({ success: true, balance: newBalance });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to credit wallet' });
    }
});

// --------------------------------------------------------------------
// Auth & User Endpoints
// --------------------------------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
    const { name, phone, platform, zone, income, password } = req.body;
    const userId = "user_" + Date.now();
    
    if (db) {
        await db.collection('users').doc(userId).set({ name, phone, platform, zone, income, password, createdAt: new Date() });
    }
    return res.json({ success: true, userId, name });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (db) {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('phone', '==', email).get();
        if (snapshot.empty) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        let foundUser = null;
        let userId = null;
        snapshot.forEach(doc => {
            if (doc.data().password === password) {
                foundUser = doc.data();
                userId = doc.id;
            }
        });

        if (foundUser) {
            return res.json({ success: true, userId, name: foundUser.name, user: foundUser });
        } else {
            return res.status(401).json({ error: 'Incorrect password' });
        }
    }
    return res.json({ success: true, userId: "mock-user-123", name: "Alex (Demo)", user: { platform: "Blinkit", zone: "Patia" } });
});

app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    if (db) {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) return res.json({ success: true, user: doc.data() });
    }
    return res.json({ success: true, user: { name: "Alex (Demo)", platform: "Blinkit", zone: "Patia" } });
});

// --------------------------------------------------------------------
// Analytics Endpoint
// --------------------------------------------------------------------
app.get('/api/analytics', async (req, res) => {
    try {
        let totalWorkers = 0;
        let activePolicies = 0;
        let totalClaims = 0;
        let totalPayout = 0;
        
        let payoutTrends = [0, 0, 0, 0, 0, 0, 0];
        const zoneCounts = {};

        // Dynamic counts if available
        if (db) {
            const usersSnap = await db.collection('users').get();
            totalWorkers = usersSnap.size;

            const policiesSnap = await db.collection('policies').get();
            activePolicies = policiesSnap.size;
            
            policiesSnap.forEach(doc => {
                const data = doc.data();
                if (data.zone) {
                    zoneCounts[data.zone] = (zoneCounts[data.zone] || 0) + 1;
                }
            });

            const walletsSnap = await db.collection('wallets').get();
            walletsSnap.forEach(doc => {
                const data = doc.data();
                if (data.history) {
                    data.history.forEach(item => {
                        if (item.amount > 0 && item.reason && item.reason.includes('Payout')) {
                            totalClaims++;
                            totalPayout += item.amount;
                            
                            // Map to day of week trend (last 7 days approx)
                            try {
                                const d = new Date(item.date._seconds ? item.date._seconds * 1000 : item.date);
                                const today = new Date();
                                const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
                                if (diffDays >= 0 && diffDays < 7) {
                                    // Index 6 is today, 0 is 6 days ago
                                    payoutTrends[6 - diffDays] += item.amount;
                                }
                            } catch(e) {}
                        }
                    });
                }
            });
        }
        
        // Finalize zones data for the chart
        let zonesLabels = Object.keys(zoneCounts);
        let zonesData = Object.values(zoneCounts);
        
        // Provide empty chart rendering if absolutely no real data is found yet
        if (zonesLabels.length === 0) {
            zonesLabels.push('No Data Available');
            zonesData.push(1); // placeholder to render doughnut gracefully
        }

        return res.json({
            success: true,
            totalWorkers,
            activePolicies,
            totalClaims,
            totalPayout,
            charts: {
                payoutTrends,
                zonesData,
                zonesLabels
            }
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// --------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`🚀 SafeGig Backend running on http://localhost:${PORT}`);
});
