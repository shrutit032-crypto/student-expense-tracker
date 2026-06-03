const db = require('../config/db');

exports.getSummary = (req, res) => {
    try {
        const { month } = req.query;
        const currentMonth = month || new Date().toISOString().slice(0, 7);

        // Total spent this month
        const totalRow = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y-%m', date) = ?
        `).get(req.user.id, currentMonth);

        // Category-wise breakdown
        const categoryBreakdown = db.prepare(`
            SELECT c.name, c.icon, COALESCE(SUM(e.amount), 0) as total
            FROM categories c
            LEFT JOIN expenses e ON e.category_id = c.id
                AND e.user_id = ? AND strftime('%Y-%m', e.date) = ?
            GROUP BY c.id
            HAVING total > 0
            ORDER BY total DESC
        `).all(req.user.id, currentMonth);

        // Daily spending for the month
        const dailySpending = db.prepare(`
            SELECT date, SUM(amount) as total
            FROM expenses
            WHERE user_id = ? AND strftime('%Y-%m', date) = ?
            GROUP BY date
            ORDER BY date
        `).all(req.user.id, currentMonth);

        // Recent expenses (last 5)
        const recentExpenses = db.prepare(`
            SELECT e.*, c.name as category_name, c.icon as category_icon
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ?
            ORDER BY e.date DESC, e.created_at DESC
            LIMIT 5
        `).all(req.user.id);

        // Budget alerts (over-budget categories)
        const budgetAlerts = db.prepare(`
            SELECT * FROM (
                SELECT b.monthly_limit, c.name as category_name, c.icon,
                       COALESCE((
                           SELECT SUM(e.amount) FROM expenses e
                           WHERE e.user_id = b.user_id AND e.category_id = b.category_id
                             AND strftime('%Y-%m', e.date) = b.month
                       ), 0) as spent
                FROM budgets b
                JOIN categories c ON b.category_id = c.id
                WHERE b.user_id = ? AND b.month = ?
            ) WHERE spent > monthly_limit
        `).all(req.user.id, currentMonth);

        // Monthly trend (last 6 months)
        const monthlyTrend = db.prepare(`
            SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
            FROM expenses
            WHERE user_id = ? AND date >= DATE('now', '-6 months')
            GROUP BY month
            ORDER BY month
        `).all(req.user.id);

        res.json({
            totalSpent: totalRow.total,
            categoryBreakdown,
            dailySpending,
            recentExpenses,
            budgetAlerts,
            monthlyTrend
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard: ' + err.message });
    }
};
