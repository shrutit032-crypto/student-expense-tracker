const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret';

exports.register = (req, res) => {
    try {
        const { name, email, password, role, parent_email } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare(
            'INSERT INTO users (name, email, password, role, parent_email) VALUES (?, ?, ?, ?, ?)'
        );
        const result = stmt.run(name, email, hashedPassword, role || 'student', parent_email || null);

        const token = jwt.sign(
            { id: result.lastInsertRowid, email, role: role || 'student' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful.',
            token,
            user: { id: result.lastInsertRowid, name, email, role: role || 'student' }
        });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
};

exports.login = (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
};

exports.getProfile = (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, parent_email, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile: ' + err.message });
    }
};
