import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../services/api';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [month]);

    async function loadDashboard() {
        setLoading(true);
        try {
            const res = await getDashboardSummary({ month });
            setData(res.data);
        } catch (err) {
            console.error('Dashboard load failed:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (!data) return <div className="error">Failed to load dashboard.</div>;

    const maxCat = data.categoryBreakdown.length > 0
        ? Math.max(...data.categoryBreakdown.map(c => c.total))
        : 1;

    return (
        <div className="page">
            <div className="page-header">
                <h1>📊 Dashboard</h1>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="month-picker" />
            </div>

            {/* Summary Cards */}
            <div className="card-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value">₹{data.totalSpent.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Categories Used</div>
                    <div className="stat-value">{data.categoryBreakdown.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Budget Alerts</div>
                    <div className="stat-value warning">{data.budgetAlerts.length}</div>
                </div>
            </div>

            {/* Budget Alerts */}
            {data.budgetAlerts.length > 0 && (
                <div className="card">
                    <h3>⚠️ Budget Alerts</h3>
                    {data.budgetAlerts.map((a, i) => (
                        <div key={i} className="alert alert-warning">
                            {a.icon} <strong>{a.category_name}</strong>: ₹{a.spent.toFixed(0)} spent of ₹{a.monthly_limit.toFixed(0)} budget
                        </div>
                    ))}
                </div>
            )}

            {/* Category Breakdown */}
            <div className="card">
                <h3>Category Breakdown</h3>
                {data.categoryBreakdown.length === 0 ? (
                    <p className="empty-state">No expenses this month. Start tracking!</p>
                ) : (
                    <div className="category-bars">
                        {data.categoryBreakdown.map(cat => (
                            <div key={cat.name} className="category-bar-row">
                                <span className="cat-label">{cat.icon} {cat.name}</span>
                                <div className="bar-container">
                                    <div className="bar" style={{ width: `${(cat.total / maxCat) * 100}%` }}></div>
                                </div>
                                <span className="cat-amount">₹{cat.total.toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Monthly Trend */}
            {data.monthlyTrend.length > 0 && (
                <div className="card">
                    <h3>Monthly Trend</h3>
                    <div className="trend-chart">
                        {data.monthlyTrend.map(m => {
                            const maxTrend = Math.max(...data.monthlyTrend.map(t => t.total));
                            return (
                                <div key={m.month} className="trend-bar-col">
                                    <div className="trend-bar" style={{ height: `${(m.total / maxTrend) * 120}px` }}></div>
                                    <span className="trend-label">{m.month.slice(5)}</span>
                                    <span className="trend-amount">₹{m.total.toFixed(0)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Expenses */}
            <div className="card">
                <h3>Recent Expenses</h3>
                {data.recentExpenses.length === 0 ? (
                    <p className="empty-state">No expenses recorded yet.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
                        </thead>
                        <tbody>
                            {data.recentExpenses.map(exp => (
                                <tr key={exp.id}>
                                    <td>{exp.date}</td>
                                    <td>{exp.description || '-'}</td>
                                    <td>{exp.category_icon} {exp.category_name}</td>
                                    <td>₹{exp.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
