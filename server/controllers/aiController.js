const { generateInsights } = require('../services/aiService');

exports.getInsights = (req, res) => {
    try {
        const insights = generateInsights(req.user.id);
        res.json({ insights });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate insights: ' + err.message });
    }
};
