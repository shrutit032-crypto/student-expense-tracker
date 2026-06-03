import { useState, useEffect } from 'react';
import { getExpenses, addExpense, deleteExpense, getCategories } from '../services/api';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCat] = useState([]);
    const [total, setTotal] = useState(0);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [form, setForm] = useState({ amount: '', description: '', category_id: '', date: new Date().toISOString().split('T')[0] });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadCategories(); }, []);
    useEffect(() => { loadExpenses(); }, [month]);

    async function loadCategories() {
        try {
            const res = await getCategories();
            setCat(res.data.categories);
        } catch (err) {
            console.error('Failed to load categories');
        }
    }

    async function loadExpenses() {
        setLoading(true);
        try {
            const res = await getExpenses({ month });
            setExpenses(res.data.expenses);
            setTotal(res.data.total);
        } catch (err) {
            console.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd(e) {
        e.preventDefault();
        setError('');
        if (!form.amount || parseFloat(form.amount) <= 0) {
            setError('Enter a valid amount.');
            return;
        }
        try {
            await addExpense({
                amount: parseFloat(form.amount),
                description: form.description,
                category_id: form.category_id ? parseInt(form.category_id) : undefined,
                date: form.date
            });
            setForm({ amount: '', description: '', category_id: '', date: new Date().toISOString().split('T')[0] });
            loadExpenses();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add expense.');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await deleteExpense(id);
            loadExpenses();
        } catch (err) {
            console.error('Delete failed');
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>💰 Expenses</h1>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="month-picker" />
            </div>

            {/* Add Expense Form */}
            <div className="card">
                <h3>Add Expense</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleAdd} className="inline-form">
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Amount (₹)"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description (e.g., lunch, uber ride)"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                    <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                        <option value="">Auto-detect category</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                    />
                    <button type="submit" className="btn btn-primary">Add</button>
                </form>
                <p className="hint">Tip: Leave category empty — it auto-detects from your description!</p>
            </div>

            {/* Total */}
            <div className="stat-card inline-stat">
                <span>Total for {month}:</span>
                <strong>₹{total.toFixed(2)}</strong>
            </div>

            {/* Expense List */}
            <div className="card">
                <h3>Expense History</h3>
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : expenses.length === 0 ? (
                    <p className="empty-state">No expenses for this month.</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td>{exp.date}</td>
                                    <td>{exp.description || '-'}</td>
                                    <td>{exp.category_icon} {exp.category_name}</td>
                                    <td>₹{exp.amount.toFixed(2)}</td>
                                    <td>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
