const axios = require('axios');

exports.callAI = async (payload) => {
    const res = await axios.post(process.env.AI_URL, payload);
    return res.data;
};