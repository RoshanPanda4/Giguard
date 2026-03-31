const { db } = require('../config/firebase');

exports.getWallet = async (req, res) => {
    const ref = db.collection('wallets').doc(req.user.userId);
    const doc = await ref.get();

    if (!doc.exists) {
        return res.json({ balance: 0, history: [] });
    }

    res.json(doc.data());
};

exports.creditWallet = async (req, res) => {
    const { amount } = req.body;

    const ref = db.collection('wallets').doc(req.user.userId);
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
};