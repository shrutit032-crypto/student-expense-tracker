import { useState, useEffect } from 'react';
import { getBudgets, setBudget, deleteBudget, getCategories } from '../services/api';

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCat] = useState([]);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [form, setForm] = useState({ category_id: '', monthly_limit: '' });
    const [error, setError] = useState('');

    useEffect(() => { loadCategories(); }, []);
    useEffect(() => { loadBudgets(); }, [month]);

    async function loadCategories() {
        try {
            const res = await getCategories();
            setCat(res.data.categories);
        } catch (err) {
            console.error('Failed to load categories');
        }
    }

    async function loadBudgets() {
        try {
            const res = await getBudgets({ month });
            setBudgets(res.data.budgets);
        } catch (err) {
            console.error('Failed to load budgets');
        }
    }

    async function handleSet(e) {
        e.preventDefault();
        setError('');
        if (!form.category_id || !form.monthly_limit) {
            setError('Select a category and enter a limit.');
            return;
        }
        try {
            await setBudget({
                category_id: parseInt(form.category_id),
                monthly_limit: parseFloat(form.monthly_limit),
                month
            });
            setForm({ category_id: '', monthly_limit: '' });
            loadBudgets();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to set budget.');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Remove this budget?')) return;
        try {
            await deleteBudget(id);
            loadBudgets();
        } catch (err) {
            console.error('Delete failed');
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>📋 Budgets</h1>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="month-picker" />
            </div>

            {/* Set Budget Form */}
            <div className="card">
                <h3>Set Monthly Budget</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSet} className="inline-form">
                    <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                        <option value="">Select category</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Monthly limit (₹)"
                        value={form.monthly_limit}
                        onChange={e => setForm({ ...form, monthly_limit: e.target.value })}
                        required
                    />
                    <button type="submit" className="btn btn-primary">Set Budget</button>
                </form>
            </div>

            {/* Budget List */}
            <div className="card">
                <h3>Budget Overview — {month}</h3>
                {budgets.length === 0 ? (
                    <p className="empty-state">No budgets set for this month. Set one above!</p>
                ) : (
                    <div className="budget-list">
                        {budgets.map(b => {
                            const pct = b.monthly_limit > 0 ? (b.spent / b.monthly_limit * 100) : 0;
                            const status = pct > 100 ? 'over' : pct > 80 ? 'warning' : 'ok';
                            return (
                                <div key={b.id} className={`budget-item budget-${status}`}>
                                    <div className="budget-header">
                                        <span>{b.category_icon} {b.category_name}</span>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>Remove</button>
                                    </div>
                                    <div className="budget-progress">
                                        <div className="progress-bar">
                                            <div className={`progress-fill progress-${status}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                        </div>
                                        <span className="budget-text">
                                            ₹{b.spent.toFixed(0)} / ₹{b.monthly_limit.toFixed(0)} ({pct.toFixed(0)}%)
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
