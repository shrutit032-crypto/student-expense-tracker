const db = require('../config/db');

// GET /api/goals?month=YYYY-MM
exports.getGoals = (req, res) => {
    try {
        const { month } = req.query;
        const userId = req.user.id;

        let goals;
        if (month) {
            goals = db.prepare(
                'SELECT * FROM savings_goals WHERE user_id = ? AND month = ? ORDER BY created_at ASC'
            ).all(userId, month);
        } else {
            goals = db.prepare(
                'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY month DESC, created_at ASC'
            ).all(userId);
        }

        res.json({ goals });
    } catch (err) {
        console.error('getGoals error:', err);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
};

// POST /api/goals
exports.createGoal = (req, res) => {
    try {
        const { name, icon, target_amount, saved_amount, month } = req.body;
        const userId = req.user.id;

        if (!name || !target_amount || !month) {
            return res.status(400).json({ error: 'name, target_amount and month are required' });
        }

        const result = db.prepare(
            `INSERT INTO savings_goals (user_id, name, icon, target_amount, saved_amount, month)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).run(userId, name, icon || '🎯', Number(target_amount), Number(saved_amount || 0), month);

        const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ goal });
    } catch (err) {
        console.error('createGoal error:', err);
        res.status(500).json({ error: 'Failed to create goal' });
    }
};

// PUT /api/goals/:id
exports.updateGoal = (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, target_amount, saved_amount } = req.body;
        const userId = req.user.id;

        const existing = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, userId);
        if (!existing) return res.status(404).json({ error: 'Goal not found' });

        db.prepare(
            `UPDATE savings_goals
             SET name = ?, icon = ?, target_amount = ?, saved_amount = ?
             WHERE id = ? AND user_id = ?`
        ).run(
            name ?? existing.name,
            icon ?? existing.icon,
            target_amount != null ? Number(target_amount) : existing.target_amount,
            saved_amount != null ? Number(saved_amount) : existing.saved_amount,
            id,
            userId
        );

        const updated = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
        res.json({ goal: updated });
    } catch (err) {
        console.error('updateGoal error:', err);
        res.status(500).json({ error: 'Failed to update goal' });
    }
};

// DELETE /api/goals/:id
exports.deleteGoal = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const existing = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?').get(id, userId);
        if (!existing) return res.status(404).json({ error: 'Goal not found' });

        db.prepare('DELETE FROM savings_goals WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        console.error('deleteGoal error:', err);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
};
