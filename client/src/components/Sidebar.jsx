// components/Sidebar.jsx
// Drop-in sidebar nav component for the fintech theme
// Usage: wrap your router outlet with <AppShell> in App.jsx

import { useState } from 'react';

const NAV_LINKS = [
    { icon: '📊', label: 'Dashboard',  path: '/dashboard'  },
    { icon: '💰', label: 'Expenses',   path: '/expenses'   },
    { icon: '📋', label: 'Budgets',    path: '/budgets'    },
    { icon: '🤖', label: 'AI Insights',path: '/insights'   },
];

export default function AppShell({ children, currentPath, onNavigate, userEmail, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="app-shell">
            {/* Mobile topbar */}
            <nav className="topbar">
                <div className="topbar-brand">
                    <div className="sidebar-brand-icon">🐦</div>
                    <span>Expense Tracker</span>
                </div>
                <button className="topbar-menu" onClick={() => setMenuOpen(v => !v)}>
                    {menuOpen ? '✕' : '☰'}
                </button>
            </nav>

            {/* Sidebar */}
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🐦</div>
                    <div>
                        <div className="sidebar-brand-name">Expense Tracker</div>
                        <div className="sidebar-brand-sub">Student Edition</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_LINKS.map(link => (
                        <button
                            key={link.path}
                            className={`sidebar-link ${currentPath === link.path ? 'active' : ''}`}
                            onClick={() => { onNavigate(link.path); setMenuOpen(false); }}
                        >
                            <span className="sidebar-link-icon">{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-user-email">{userEmail}</div>
                    <button className="sidebar-logout" onClick={onLogout}>
                        <span>⏻</span> Logout
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {menuOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                        zIndex: 99, backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
