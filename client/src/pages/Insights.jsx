import { useState, useEffect } from 'react';
import { getAIInsights } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const typeStyles = {
    success: { bg: '#d4edda', border: '#28a745', icon: '✅' },
    warning: { bg: '#fff3cd', border: '#ffc107', icon: '⚠️' },
    danger:  { bg: '#f8d7da', border: '#dc3545', icon: '🚨' },
    info:    { bg: '#d1ecf1', border: '#17a2b8', icon: '💡' },
    tip:     { bg: '#e8daef', border: '#8e44ad', icon: '🎯' },
};

export default function Insights() {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    useEffect(() => { loadInsights(); }, []);

    async function loadInsights() {
        setLoading(true);
        try {
            const res = await getAIInsights();
            setInsights(res.data.insights);
        } catch (err) {
            console.error('Failed to load insights');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>🤖 AI Financial Insights</h1>
                <button onClick={loadInsights} className="btn btn-primary">Refresh</button>
            </div>

            {loading ? (
                <div className="loading">Analyzing your spending patterns...</div>
            ) : (
                <div className="insights-grid">
                    {insights.map((insight, i) => {
                        const style = typeStyles[insight.type] || typeStyles.info;
                        return (
                            <div
                                key={i}
                                className="insight-card"
                                style={{ backgroundColor: style.bg, borderLeft: `4px solid ${style.border}` }}
                            >
                                <h3>{style.icon} {insight.title}</h3>
                                <p>{insight.message}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
