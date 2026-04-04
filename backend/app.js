const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const policyRoutes = require('./routes/policy.routes');
const walletRoutes = require('./routes/wallet.routes');
const userRoutes = require('./routes/user.routes');
const simulationRoutes = require('./routes/simulation.routes');
const reportRoutes = require('./routes/report.routes'); // ✅ ADD THIS

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// API ROUTES
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/user', userRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/reports', reportRoutes); // ✅ ADD THIS

// ======================
// SERVE USER PHOTOS
// ======================
app.use('/usrphotos', express.static(path.join(__dirname, 'usrphotos')));

// ======================
// SERVE FRONTEND
// ======================
const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ======================
// FALLBACK (SPA)
// ======================
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;