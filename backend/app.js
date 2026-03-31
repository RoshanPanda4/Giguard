const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const policyRoutes = require('./routes/policy.routes');
const walletRoutes = require('./routes/wallet.routes');
const simulationRoutes = require('./routes/simulation.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health
app.get('/health', (req, res) => {
    res.send("Backend Running ✅");
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/simulation', simulationRoutes);

module.exports = app;