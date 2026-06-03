const db = require('../config/db');

// Built-in AI insights engine (no external API needed)
// Analyzes spending patterns and generates actionable advice

function getSpendingData(userId) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const currentSpending = db.prepare(`
        SELECT c.name as category, SUM(e.amount) as total
        FROM expenses e JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ? AND strftime('%Y-%m', e.date) = ?
        GROUP BY c.name ORDER BY total DESC
    `).all(userId, currentMonth);

    const prevSpending = db.prepare(`
        SELECT c.name as category, SUM(e.amount) as total
        FROM expenses e JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ? AND strftime('%Y-%m', e.date) = ?
        GROUP BY c.name ORDER BY total DESC
    `).all(userId, prevMonth);

    const totalCurrent = currentSpending.reduce((s, r) => s + r.total, 0);
    const totalPrev = prevSpending.reduce((s, r) => s + r.total, 0);

    const budgets = db.prepare(`
        SELECT b.monthly_limit, c.name as category,
               COALESCE((SELECT SUM(e.amount) FROM expenses e
                         WHERE e.user_id = b.user_id AND e.category_id = b.category_id
                           AND strftime('%Y-%m', e.date) = b.month), 0) as spent
        FROM budgets b JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ?
    `).all(userId, currentMonth);

    return { currentSpending, prevSpending, totalCurrent, totalPrev, budgets, currentMonth, prevMonth };
}

function generateInsights(userId) {
    const data = getSpendingData(userId);
    const insights = [];

    // Spending trend
    if (data.totalPrev > 0) {
        const change = ((data.totalCurrent - data.totalPrev) / data.totalPrev * 100).toFixed(1);
        if (data.totalCurrent > data.totalPrev) {
            insights.push({
                type: 'warning',
                title: 'Spending Increased',
                message: `Your spending this month (₹${data.totalCurrent.toFixed(0)}) is ${change}% higher than last month (₹${data.totalPrev.toFixed(0)}). Consider reviewing non-essential expenses.`
            });
        } else {
            insights.push({
                type: 'success',
                title: 'Great Savings!',
                message: `Your spending this month (₹${data.totalCurrent.toFixed(0)}) is ${Math.abs(change)}% lower than last month. Keep up the good financial habits!`
            });
        }
    }

    // Top spending category
    if (data.currentSpending.length > 0) {
        const top = data.currentSpending[0];
        const pct = data.totalCurrent > 0 ? (top.total / data.totalCurrent * 100).toFixed(0) : 0;
        insights.push({
            type: 'info',
            title: `Top Spending: ${top.category}`,
            message: `${top.category} accounts for ${pct}% of your spending this month (₹${top.total.toFixed(0)}). ${
                top.category === 'Food' ? 'Try meal prepping to save on food costs.' :
                top.category === 'Entertainment' ? 'Consider free entertainment options like campus events.' :
                top.category === 'Shopping' ? 'Use a 24-hour rule before making non-essential purchases.' :
                top.category === 'Subscriptions' ? 'Review your subscriptions — cancel any you rarely use.' :
                'Look for ways to optimize this category.'
            }`
        });
    }

    // Budget alerts
    for (const b of data.budgets) {
        const pct = (b.spent / b.monthly_limit * 100).toFixed(0);
        if (b.spent > b.monthly_limit) {
            insights.push({
                type: 'danger',
                title: `Over Budget: ${b.category}`,
                message: `You've spent ₹${b.spent.toFixed(0)} out of your ₹${b.monthly_limit.toFixed(0)} budget for ${b.category} (${pct}%). Try to cut back for the rest of the month.`
            });
        } else if (b.spent > b.monthly_limit * 0.8) {
            insights.push({
                type: 'warning',
                title: `Approaching Limit: ${b.category}`,
                message: `You've used ${pct}% of your ${b.category} budget (₹${b.spent.toFixed(0)} of ₹${b.monthly_limit.toFixed(0)}). Be mindful of spending in this category.`
            });
        }
    }

    // Prediction: estimated month-end spending
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    if (dayOfMonth > 5 && data.totalCurrent > 0) {
        const projected = (data.totalCurrent / dayOfMonth * daysInMonth).toFixed(0);
        insights.push({
            type: 'info',
            title: 'Projected Month-End Spending',
            message: `At your current pace, you'll spend approximately ₹${projected} by end of this month. ${
                data.totalPrev > 0 && projected > data.totalPrev * 1.1
                    ? 'This is higher than last month — consider slowing down.'
                    : 'Keep tracking to stay on target!'
            }`
        });
    }

    // Saving tips based on patterns
    const foodSpending = data.currentSpending.find(c => c.category === 'Food');
    const entertainmentSpending = data.currentSpending.find(c => c.category === 'Entertainment');
    if (foodSpending && foodSpending.total > data.totalCurrent * 0.4) {
        insights.push({
            type: 'tip',
            title: 'Food Saving Tip',
            message: 'Food is over 40% of your expenses. Consider cooking at home, using meal plans, or finding student meal deals.'
        });
    }
    if (entertainmentSpending && entertainmentSpending.total > data.totalCurrent * 0.2) {
        insights.push({
            type: 'tip',
            title: 'Entertainment Saving Tip',
            message: 'Entertainment is over 20% of your spending. Look for free campus events, student discounts, and group activities.'
        });
    }

    if (insights.length === 0) {
        insights.push({
            type: 'info',
            title: 'Start Tracking',
            message: 'Add some expenses to get personalized AI-powered financial insights and recommendations!'
        });
    }

    return insights;
}

module.exports = { generateInsights };
