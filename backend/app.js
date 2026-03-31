const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const policyRoutes = require('./routes/policy.routes');
const walletRoutes = require('./routes/wallet.routes');
// const simulationRoutes = require('./routes/simulation.routes'); // add later if exists

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// API ROUTES FIRST
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/wallet', walletRoutes);


// ======================
// SERVE FRONTEND
// ======================

// IMPORTANT: adjust path if needed
const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

// Default route → index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ======================
// FALLBACK (SPA support)
// ======================
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;