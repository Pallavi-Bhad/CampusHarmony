const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL Database');
});

// --- AUTH ROUTES ---

// Student Registration
app.post('/api/auth/register', (req, res) => {
    const { full_name, department, year, is_hosteller, contact, email, password } = req.body;
    const query = 'INSERT INTO students (full_name, department, year, is_hosteller, contact, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [full_name, department, year, is_hosteller, contact, email, password], (err, result) => {
        if (err) return res.status(400).json({ message: 'Registration failed. Email might already exist.' });
        res.status(201).json({ message: 'Student registered successfully' });
    });
});

// Student Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM students WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        
        const user = results[0];
        res.json({ role: 'student', user: { name: user.full_name, id: user.id } });
    });
});

// Admin Registration
app.post('/api/auth/admin/register', (req, res) => {
    const { email, password } = req.body;
    const query = 'INSERT INTO admins (email, password) VALUES (?, ?)';
    db.query(query, [email, password], (err, result) => {
        if (err) return res.status(400).json({ message: 'Registration failed. Email might already exist.' });
        res.status(201).json({ message: 'Admin registered successfully' });
    });
});

// Admin Login
app.post('/api/auth/admin/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM admins WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: 'Invalid admin credentials' });
        res.json({ role: 'admin', user: { id: results[0].id } });
    });
});

// --- COMPLAINT ROUTES ---

// Submit Complaint (Student)
app.post('/api/complaints', (req, res) => {
    const { student_id, category, description } = req.body;
    const query = 'INSERT INTO complaints (student_id, category, description) VALUES (?, ?, ?)';
    db.query(query, [student_id, category, description], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to submit complaint' });
        res.status(201).json({ message: 'Complaint submitted' });
    });
});

// Get My Complaints (Student)
app.get('/api/complaints/my/:studentId', (req, res) => {
    const query = 'SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC';
    db.query(query, [req.params.studentId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch complaints' });
        res.json(results);
    });
});

// Get All Complaints (Admin)
app.get('/api/admin/complaints', (req, res) => {
    const { category, status, department } = req.query;
    let query = `
        SELECT c.*, s.full_name as student_name, s.department 
        FROM complaints c 
        JOIN students s ON c.student_id = s.id 
        WHERE 1=1
    `;
    const params = [];

    if (category) { query += ' AND c.category = ?'; params.push(category); }
    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (department) { query += ' AND s.department = ?'; params.push(department); }

    query += ' ORDER BY c.created_at DESC';

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch complaints' });
        res.json(results);
    });
});

// Update Complaint Status (Admin)
app.put('/api/admin/complaints/:id', (req, res) => {
    const { status, admin_remark } = req.body;
    const query = 'UPDATE complaints SET status = ?, admin_remark = ? WHERE id = ?';
    db.query(query, [status, admin_remark, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to update complaint' });
        res.json({ message: 'Complaint updated' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
