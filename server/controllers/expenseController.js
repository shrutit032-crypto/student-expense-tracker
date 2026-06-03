const db = require('../config/db');

// Auto-categorize based on keywords
function autoCategorizeName(description) {
    const desc = (description || '').toLowerCase();
    const rules = [
        { keywords: ['food', 'lunch', 'dinner', 'breakfast', 'snack', 'coffee', 'tea', 'restaurant', 'canteen', 'mess', 'pizza', 'burger'], category: 'Food' },
        { keywords: ['uber', 'ola', 'bus', 'metro', 'train', 'taxi', 'fuel', 'petrol', 'auto', 'transport', 'ride'], category: 'Transport' },
        { keywords: ['amazon', 'flipkart', 'myntra', 'shop', 'clothes', 'shoes', 'gadget', 'purchase'], category: 'Shopping' },
        { keywords: ['movie', 'netflix', 'game', 'concert', 'party', 'outing', 'fun', 'entertainment'], category: 'Entertainment' },
        { keywords: ['spotify', 'subscription', 'premium', 'plan', 'recharge', 'mobile'], category: 'Subscriptions' },
        { keywords: ['book', 'course', 'tuition', 'fee', 'stationery', 'pen', 'notebook', 'education'], category: 'Education' },
        { keywords: ['medicine', 'doctor', 'hospital', 'health', 'gym', 'pharmacy'], category: 'Health' },
        { keywords: ['electricity', 'water', 'wifi', 'internet', 'rent', 'utility', 'bill'], category: 'Utilities' },
    ];

    for (const rule of rules) {
        if (rule.keywords.some(kw => desc.includes(kw))) {
            return rule.category;
        }
    }
    return null;
}

exports.getCategories = (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories: ' + err.message });
    }
};

exports.addExpense = (req, res) => {
    try {
        let { category_id, amount, description, date } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required.' });
        }

        // Auto-categorize if no category provided
        if (!category_id && description) {
            const guessedName = autoCategorizeName(description);
            if (guessedName) {
                const cat = db.prepare('SELECT id FROM categories WHERE name = ?').get(guessedName);
                if (cat) category_id = cat.id;
            }
        }

        // Default to 'Other' if still no category
        if (!category_id) {
            const other = db.prepare("SELECT id FROM categories WHERE name = 'Other'").get();
            category_id = other ? other.id : 9;
        }

        const stmt = db.prepare(
            'INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)'
        );
        const result = stmt.run(req.user.id, category_id, amount, description || '', date || new Date().toISOString().split('T')[0]);

        const expense = db.prepare(`
            SELECT e.*, c.name as category_name, c.icon as category_icon
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ message: 'Expense added.', expense });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add expense: ' + err.message });
    }
};

exports.getExpenses = (req, res) => {
    try {
        const { month, category_id, sort } = req.query;
        let query = `
            SELECT e.*, c.name as category_name, c.icon as category_icon
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ?
        `;
        const params = [req.user.id];

        if (month) {
            query += " AND strftime('%Y-%m', e.date) = ?";
            params.push(month);
        }
        if (category_id) {
            query += ' AND e.category_id = ?';
            params.push(category_id);
        }

        query += sort === 'amount' ? ' ORDER BY e.amount DESC' : ' ORDER BY e.date DESC';

        const expenses = db.prepare(query).all(...params);
        const totalRow = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?
            ${month ? " AND strftime('%Y-%m', date) = ?" : ''}
        `).get(...(month ? [req.user.id, month] : [req.user.id]));

        res.json({ expenses, total: totalRow.total });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch expenses: ' + err.message });
    }
};

exports.updateExpense = (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, description, date } = req.body;

        const existing = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, req.user.id);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        db.prepare(
            'UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ? WHERE id = ?'
        ).run(
            category_id || existing.category_id,
            amount || existing.amount,
            description !== undefined ? description : existing.description,
            date || existing.date,
            id
        );

        const updated = db.prepare(`
            SELECT e.*, c.name as category_name, c.icon as category_icon
            FROM expenses e JOIN categories c ON e.category_id = c.id WHERE e.id = ?
        `).get(id);

        res.json({ message: 'Expense updated.', expense: updated });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update expense: ' + err.message });
    }
};

exports.deleteExpense = (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, req.user.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Expense not found.' });
        }
        res.json({ message: 'Expense deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete expense: ' + err.message });
    }
};
