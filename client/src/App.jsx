import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
}

function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) return null;

    const navItems = [
        { path: '/dashboard', label: '📊 Dashboard' },
        { path: '/expenses', label: '💰 Expenses' },
        { path: '/budgets', label: '📋 Budgets' },
        { path: '/insights', label: '🤖 AI Insights' },
    ];

    return (
        <nav className="navbar">
            <div className="nav-brand">🎓 Student Expense Tracker</div>
            <div className="nav-links">
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            <div className="nav-user">
                <span>Hi, {user?.name || user?.email}</span>
                <button onClick={logout} className="btn btn-sm btn-outline">Logout</button>
            </div>
        </nav>
    );
}

export default function App() {
    return (
        <div className="app">
            <Navbar />
            <main className="main-content">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
                    <Route path="/budgets" element={<PrivateRoute><Budgets /></PrivateRoute>} />
                    <Route path="/insights" element={<PrivateRoute><Insights /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </main>
        </div>
    );
}
