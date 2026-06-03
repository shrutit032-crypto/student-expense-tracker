const db = require('../config/db');

exports.setBudget = (req, res) => {
    try {
        const { category_id, monthly_limit, month } = req.body;

        if (!category_id || !monthly_limit || !month) {
            return res.status(400).json({ error: 'category_id, monthly_limit, and month are required.' });
        }

        const stmt = db.prepare(`
            INSERT INTO budgets (user_id, category_id, monthly_limit, month)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, category_id, month) DO UPDATE SET monthly_limit = excluded.monthly_limit
        `);
        stmt.run(req.user.id, category_id, monthly_limit, month);

        res.status(201).json({ message: 'Budget set successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to set budget: ' + err.message });
    }
};

exports.getBudgets = (req, res) => {
    try {
        const { month } = req.query;
        const currentMonth = month || new Date().toISOString().slice(0, 7);

        const budgets = db.prepare(`
            SELECT b.*, c.name as category_name, c.icon as category_icon,
                   COALESCE((
                       SELECT SUM(e.amount)
                       FROM expenses e
                       WHERE e.user_id = b.user_id
                         AND e.category_id = b.category_id
                         AND strftime('%Y-%m', e.date) = b.month
                   ), 0) as spent
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = ? AND b.month = ?
            ORDER BY c.name
        `).all(req.user.id, currentMonth);

        res.json({ budgets });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch budgets: ' + err.message });
    }
};

exports.deleteBudget = (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, req.user.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Budget not found.' });
        }
        res.json({ message: 'Budget deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete budget: ' + err.message });
    }
};
