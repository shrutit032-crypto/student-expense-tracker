import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../services/api';

// ── Animated counter ────────────────────────────────────────
function useCountUp(target, duration = 1000) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!target) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setValue(target); clearInterval(timer); }
            else setValue(start);
        }, 16);
        return () => clearInterval(timer);
    }, [target]);
    return value;
}

// ── SVG Donut Chart ─────────────────────────────────────────
function DonutChart({ data }) {
    if (!data || data.length === 0) return null;
    const size = 200, cx = 100, cy = 100, r = 72, stroke = 22;
    const circumference = 2 * Math.PI * r;
    const total = data.reduce((s, d) => s + d.total, 0);
    const colors = ['#7c3aed','#06b6d4','#8b5cf6','#0e7490','#a78bfa','#67e8f9','#c4b5fd','#22d3ee'];
    let offset = 0;

    return (
        <div className="donut-wrap">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                {data.map((d, i) => {
                    const pct = d.total / total;
                    const dash = pct * circumference;
                    const gap = circumference - dash;
                    const el = (
                        <circle
                            key={d.name}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth={stroke}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset * circumference}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s ease', filter: 'drop-shadow(0 0 6px currentColor)' }}
                        />
                    );
                    offset += pct;
                    return el;
                })}
                <text x={cx} y={cy - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="'DM Mono', monospace">TOTAL</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700" fontFamily="'Sora', sans-serif">
                    ₹{(total / 1000).toFixed(1)}k
                </text>
            </svg>
            <div className="donut-legend">
                {data.map((d, i) => (
                    <div key={d.name} className="legend-item">
                        <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
                        <span className="legend-name">{d.icon} {d.name}</span>
                        <span className="legend-val">₹{d.total.toFixed(0)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Sparkline bar chart ─────────────────────────────────────
function TrendChart({ data }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.total));
    return (
        <div className="trend-bars">
            {data.map((m, i) => (
                <div key={m.month} className="trend-col">
                    <div className="trend-bar-outer">
                        <div
                            className="trend-bar-inner"
                            style={{ height: `${(m.total / max) * 100}%`, animationDelay: `${i * 0.08}s` }}
                        />
                    </div>
                    <span className="trend-mo">{m.month.slice(5)}</span>
                    <span className="trend-amt">₹{(m.total / 1000).toFixed(1)}k</span>
                </div>
            ))}
        </div>
    );
}

// ── Health Score Ring ───────────────────────────────────────
function HealthRing({ score }) {
    const r = 54, c = 2 * Math.PI * r;
    const dash = (score / 100) * c;
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Attention';
    return (
        <div className="health-ring-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                <circle
                    cx="70" cy="70" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${c - dash}`}
                    strokeDashoffset={c / 4}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
                />
                <text x="70" y="64" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="'Sora', sans-serif">{score}</text>
                <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="'DM Mono', monospace">SCORE</text>
            </svg>
            <span className="health-label" style={{ color }}>{label}</span>
        </div>
    );
}

function computeHealthScore(data) {
    if (!data) return 50;
    let score = 100;
    if (data.budgetAlerts.length > 0) score -= data.budgetAlerts.length * 15;
    if (data.totalSpent > 30000) score -= 20;
    else if (data.totalSpent > 15000) score -= 10;
    return Math.max(10, Math.min(100, score));
}

// ── AI Insight Card ─────────────────────────────────────────
function AIInsightCard({ data }) {
    const insights = [];

    if (data.categoryBreakdown.length > 0) {
        const top = [...data.categoryBreakdown].sort((a, b) => b.total - a.total)[0];
        insights.push({
            icon: '🔍',
            text: `${top.icon} ${top.name} is your biggest spend at ₹${top.total.toFixed(0)} this month.`,
            color: '#a78bfa',
        });
    }
    if (data.budgetAlerts.length > 0) {
        insights.push({
            icon: '⚡',
            text: `You've exceeded ${data.budgetAlerts.length} budget${data.budgetAlerts.length > 1 ? 's' : ''}. Consider cutting discretionary spend.`,
            color: '#f59e0b',
        });
    } else if (data.categoryBreakdown.length > 0) {
        insights.push({
            icon: '✨',
            text: "Great discipline! All budgets are within limits this month.",
            color: '#10b981',
        });
    }
    if (data.monthlyTrend && data.monthlyTrend.length >= 2) {
        const last = data.monthlyTrend[data.monthlyTrend.length - 1];
        const prev = data.monthlyTrend[data.monthlyTrend.length - 2];
        const diff = last.total - prev.total;
        const pct = prev.total > 0 ? Math.abs((diff / prev.total) * 100).toFixed(0) : 0;
        if (diff > 0) {
            insights.push({ icon: '📊', text: `Spending is up ${pct}% vs last month. Review recent expenses.`, color: '#f87171' });
        } else if (diff < 0) {
            insights.push({ icon: '📊', text: `Spending is down ${pct}% vs last month. You're on the right track!`, color: '#10b981' });
        }
    }
    if (insights.length === 0) {
        insights.push({ icon: '💡', text: 'Add some expenses and budgets to unlock AI-powered insights.', color: '#67e8f9' });
    }

    return (
        <div className="ft-card ft-ai-card">
            <div className="ft-card-header">
                <span className="ft-card-icon">🤖</span>
                <h3>AI Insights</h3>
                <span className="ft-ai-badge">Smart Analysis</span>
            </div>
            <div className="ft-ai-list">
                {insights.map((ins, i) => (
                    <div key={i} className="ft-ai-row" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="ft-ai-dot" style={{ background: ins.color, boxShadow: `0 0 8px ${ins.color}` }} />
                        <p className="ft-ai-text">{ins.icon} {ins.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Expense Prediction Card ─────────────────────────────────
function ExpensePredictionCard({ data }) {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const daysLeft = daysInMonth - daysPassed;
    const dailyRate = daysPassed > 0 ? data.totalSpent / daysPassed : 0;
    const predicted = dailyRate * daysInMonth;
    const progressPct = Math.min((daysPassed / daysInMonth) * 100, 100);
    const spendPct = Math.min((data.totalSpent / predicted) * 100, 100) || 0;

    return (
        <div className="ft-card ft-predict-card">
            <div className="ft-card-header">
                <span className="ft-card-icon">🔮</span>
                <h3>Expense Prediction</h3>
            </div>
            <div className="ft-predict-body">
                <div className="ft-predict-stat">
                    <span className="ft-predict-label">Projected Month-End</span>
                    <span className="ft-predict-value">₹{predicted.toFixed(0)}</span>
                </div>
                <div className="ft-predict-stat">
                    <span className="ft-predict-label">Daily Burn Rate</span>
                    <span className="ft-predict-value ft-cyan">₹{dailyRate.toFixed(0)}<span className="ft-predict-unit">/day</span></span>
                </div>
                <div className="ft-predict-stat">
                    <span className="ft-predict-label">Days Left</span>
                    <span className="ft-predict-value ft-purple">{daysLeft}</span>
                </div>
            </div>
            <div className="ft-predict-track-wrap">
                <div className="ft-predict-track-labels">
                    <span>Month Progress</span>
                    <span>{daysPassed}/{daysInMonth} days</span>
                </div>
                <div className="ft-progress-track">
                    <div className="ft-progress-fill ft-progress-time" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="ft-predict-track-labels" style={{ marginTop: 10 }}>
                    <span>Spend Progress</span>
                    <span>₹{data.totalSpent.toFixed(0)} / ₹{predicted.toFixed(0)}</span>
                </div>
                <div className="ft-progress-track">
                    <div className="ft-progress-fill ft-progress-spend" style={{ width: `${spendPct}%` }} />
                </div>
            </div>
        </div>
    );
}

// ── Savings Goal Card ───────────────────────────────────────
function SavingsGoalCard({ data }) {
    // Derive a simple savings goal from spend data
    const avgMonthly = data.monthlyTrend && data.monthlyTrend.length > 0
        ? data.monthlyTrend.reduce((s, m) => s + m.total, 0) / data.monthlyTrend.length
        : data.totalSpent;

    // Suggest saving 20% of estimated income (heuristic: income ≈ 1.4× avg spend)
    const estimatedIncome = avgMonthly * 1.4;
    const savingsTarget = estimatedIncome * 0.2;
    const currentSaved = Math.max(0, estimatedIncome - data.totalSpent);
    const pct = savingsTarget > 0 ? Math.min((currentSaved / savingsTarget) * 100, 100) : 0;
    const onTrack = currentSaved >= savingsTarget;

    const milestones = [
        { label: 'Emergency Fund', icon: '🛡️', target: savingsTarget * 6, saved: currentSaved * 3 },
        { label: 'Travel Fund', icon: '✈️', target: 15000, saved: currentSaved * 0.5 },
        { label: 'Gadget Fund', icon: '💻', target: 10000, saved: currentSaved * 0.3 },
    ];

    return (
        <div className="ft-card ft-savings-card">
            <div className="ft-card-header">
                <span className="ft-card-icon">🎯</span>
                <h3>Savings Goals</h3>
                <span className={`ft-savings-status ${onTrack ? 'ft-savings-ok' : 'ft-savings-warn'}`}>
                    {onTrack ? 'On Track' : 'Behind'}
                </span>
            </div>

            <div className="ft-savings-main">
                <div className="ft-savings-ring-wrap">
                    <svg width="90" height="90" viewBox="0 0 90 90">
                        <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                        <circle
                            cx="45" cy="45" r="36"
                            fill="none"
                            stroke={onTrack ? '#10b981' : '#f59e0b'}
                            strokeWidth="8"
                            strokeDasharray={`${(pct / 100) * 226} 226`}
                            strokeDashoffset="56"
                            strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 5px ${onTrack ? '#10b981' : '#f59e0b'})`, transition: 'stroke-dasharray 1s ease' }}
                        />
                        <text x="45" y="41" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="'Sora', sans-serif">
                            {pct.toFixed(0)}%
                        </text>
                        <text x="45" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="'DM Mono', monospace">SAVED</text>
                    </svg>
                </div>
                <div className="ft-savings-info">
                    <div className="ft-savings-row">
                        <span className="ft-savings-lbl">Monthly Target</span>
                        <span className="ft-savings-val">₹{savingsTarget.toFixed(0)}</span>
                    </div>
                    <div className="ft-savings-row">
                        <span className="ft-savings-lbl">Saved So Far</span>
                        <span className="ft-savings-val ft-green">₹{currentSaved.toFixed(0)}</span>
                    </div>
                    <div className="ft-savings-row">
                        <span className="ft-savings-lbl">Gap</span>
                        <span className={`ft-savings-val ${onTrack ? 'ft-green' : 'ft-warn'}`}>
                            {onTrack ? '🎉 Exceeded!' : `₹${(savingsTarget - currentSaved).toFixed(0)}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="ft-milestones">
                {milestones.map((m, i) => {
                    const mp = Math.min((m.saved / m.target) * 100, 100);
                    return (
                        <div key={i} className="ft-milestone-row">
                            <span className="ft-milestone-icon">{m.icon}</span>
                            <div className="ft-milestone-info">
                                <div className="ft-milestone-label">{m.label}</div>
                                <div className="ft-progress-track ft-milestone-track">
                                    <div className="ft-progress-fill ft-progress-milestone" style={{ width: `${mp}%` }} />
                                </div>
                            </div>
                            <span className="ft-milestone-pct">{mp.toFixed(0)}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Quick Nav Tabs ──────────────────────────────────────────
function QuickNav({ active, onChange }) {
    const tabs = [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'insights', icon: '🤖', label: 'Insights' },
    ];
    return (
        <div className="ft-quicknav">
            {tabs.map(t => (
                <button
                    key={t.id}
                    className={`ft-quicknav-btn ${active === t.id ? 'ft-quicknav-active' : ''}`}
                    onClick={() => onChange(t.id)}
                >
                    <span className="ft-quicknav-icon">{t.icon}</span>
                    <span className="ft-quicknav-label">{t.label}</span>
                </button>
            ))}
        </div>
    );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
    const [data, setData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const month = selectedDate.slice(0, 7); // YYYY-MM used for API
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const spent = useCountUp(data?.totalSpent || 0, 1200);

    useEffect(() => { loadDashboard(); }, [month]);

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

    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    if (loading) return (
        <div className="ft-loader">
            <div className="ft-spinner" />
            <p>Syncing your finances…</p>
        </div>
    );
    if (!data) return <div className="ft-error">Failed to load dashboard.</div>;

    const maxCat = data.categoryBreakdown.length > 0
        ? Math.max(...data.categoryBreakdown.map(c => c.total))
        : 1;
    const healthScore = computeHealthScore(data);

    return (
        <div className="ft-page">

            {/* ── Page Header ── */}
            <div className="ft-page-header">
                <div>
                    <h1 className="ft-title">Dashboard</h1>
                    <p className="ft-subtitle">Snapshot for {formattedDate}</p>
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="ft-month-picker"
                />
            </div>

            {/* ── Quick Nav ── */}
            <QuickNav active={activeTab} onChange={setActiveTab} />

            {/* ══════════ OVERVIEW TAB ══════════ */}
            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards */}
                    <div className="ft-kpi-grid">
                        <div className="ft-kpi-card ft-kpi-main">
                            <div className="ft-kpi-label">Total Spent</div>
                            <div className="ft-kpi-value">₹{spent.toFixed(2)}</div>
                            <div className="ft-kpi-badge">This month</div>
                            <div className="ft-kpi-glow" />
                        </div>
                        <div className="ft-kpi-card">
                            <div className="ft-kpi-label">Categories Used</div>
                            <div className="ft-kpi-value ft-cyan">{data.categoryBreakdown.length}</div>
                            <div className="ft-kpi-badge">Active</div>
                        </div>
                        <div className="ft-kpi-card">
                            <div className="ft-kpi-label">Budget Alerts</div>
                            <div className={`ft-kpi-value ${data.budgetAlerts.length > 0 ? 'ft-warn' : 'ft-green'}`}>
                                {data.budgetAlerts.length}
                            </div>
                            <div className="ft-kpi-badge">{data.budgetAlerts.length > 0 ? 'Needs review' : 'All clear'}</div>
                        </div>
                    </div>

                    {/* Budget Alerts */}
                    {data.budgetAlerts.length > 0 && (
                        <div className="ft-card ft-alerts-card">
                            <div className="ft-card-header">
                                <span className="ft-card-icon">⚠️</span>
                                <h3>Budget Alerts</h3>
                            </div>
                            <div className="ft-alerts-list">
                                {data.budgetAlerts.map((a, i) => (
                                    <div key={i} className="ft-alert-row">
                                        <div className="ft-alert-info">
                                            <span className="ft-alert-cat">{a.icon} {a.category_name}</span>
                                            <div className="ft-alert-bar-wrap">
                                                <div
                                                    className="ft-alert-bar"
                                                    style={{ width: `${Math.min((a.spent / a.monthly_limit) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="ft-alert-nums">
                                            <span className="ft-alert-spent">₹{a.spent.toFixed(0)}</span>
                                            <span className="ft-alert-limit">/ ₹{a.monthly_limit.toFixed(0)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Donut + Health Score */}
                    <div className="ft-mid-grid">
                        <div className="ft-card ft-donut-card">
                            <div className="ft-card-header">
                                <span className="ft-card-icon">🍩</span>
                                <h3>Category Breakdown</h3>
                            </div>
                            {data.categoryBreakdown.length === 0 ? (
                                <div className="ft-empty">No expenses this month. Start tracking!</div>
                            ) : (
                                <DonutChart data={data.categoryBreakdown} />
                            )}
                        </div>

                        <div className="ft-card ft-health-card">
                            <div className="ft-card-header">
                                <span className="ft-card-icon">💎</span>
                                <h3>Financial Health</h3>
                            </div>
                            <HealthRing score={healthScore} />
                            <div className="ft-health-tips">
                                {data.budgetAlerts.length === 0 && (
                                    <div className="ft-tip ft-tip-good">✓ No budgets exceeded</div>
                                )}
                                {data.categoryBreakdown.length > 0 && (
                                    <div className="ft-tip ft-tip-good">✓ {data.categoryBreakdown.length} categories tracked</div>
                                )}
                                {data.budgetAlerts.length > 0 && (
                                    <div className="ft-tip ft-tip-warn">⚠ {data.budgetAlerts.length} budget(s) exceeded</div>
                                )}
                                {data.totalSpent > 15000 && (
                                    <div className="ft-tip ft-tip-warn">⚠ High spend this month</div>
                                )}
                            </div>
                        </div>
                    </div>



                    {/* Recent Expenses */}
                    <div className="ft-card">
                        <div className="ft-card-header">
                            <span className="ft-card-icon">🧾</span>
                            <h3>Recent Expenses</h3>
                        </div>
                        {data.recentExpenses.length === 0 ? (
                            <div className="ft-empty">No expenses recorded yet.</div>
                        ) : (
                            <div className="ft-table-wrap">
                                <table className="ft-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recentExpenses.map((exp, i) => (
                                            <tr key={exp.id} style={{ animationDelay: `${i * 0.05}s` }} className="ft-tr-animate">
                                                <td className="ft-td-mono">{exp.date}</td>
                                                <td>{exp.description || <span className="ft-muted">—</span>}</td>
                                                <td>
                                                    <span className="ft-cat-chip">
                                                        {exp.category_icon} {exp.category_name}
                                                    </span>
                                                </td>
                                                <td className="ft-td-amount">₹{exp.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ══════════ INSIGHTS TAB ══════════ */}
            {activeTab === 'insights' && (
                <>
                    {/* AI Insight + Prediction side-by-side */}
                    <div className="ft-insight-grid">
                        <AIInsightCard data={data} />
                        <ExpensePredictionCard data={data} />
                    </div>

                    {/* Category Breakdown repeated for context */}
                    <div className="ft-card">
                        <div className="ft-card-header">
                            <span className="ft-card-icon">📊</span>
                            <h3>Category Breakdown</h3>
                        </div>
                        {data.categoryBreakdown.length === 0 ? (
                            <div className="ft-empty">No expenses this month.</div>
                        ) : (
                            <div className="category-bars">
                                {data.categoryBreakdown.map(cat => (
                                    <div key={cat.name} className="category-bar-row">
                                        <span className="cat-label">{cat.icon} {cat.name}</span>
                                        <div className="bar-container">
                                            <div className="bar" style={{ width: `${(cat.total / maxCat) * 100}%` }} />
                                        </div>
                                        <span className="cat-amount">₹{cat.total.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}



        </div>
    );
}
