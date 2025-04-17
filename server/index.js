const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware to verify JWT and role
const authenticate = (requiredRole) => async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (requiredRole && req.user.role !== requiredRole) {
      return res.status(403).send('Unauthorized');
    }
    next();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
};

// Signup (admin creates accounts)
app.post('/auth/signup', authenticate('admin'), async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, role, name]
    );
    res.status(201).send('User created');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).send('User not found');
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).send('Invalid password');
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Create shift (admin only)
app.post('/shifts', authenticate('admin'), async (req, res) => {
  const { employee_id, start_time, end_time, role } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO shifts (employee_id, start_time, end_time, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [employee_id, start_time, end_time, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating shift');
  }
});

// Get shifts (admin sees all, employees see their own released shifts)
app.get('/shifts', authenticate(), async (req, res) => {
  try {
    let query;
    let params;
    if (req.user.role === 'admin') {
      query = 'SELECT s.*, u.name AS employee_name FROM shifts s JOIN users u ON s.employee_id = u.id';
      params = [];
    } else {
      query = 'SELECT * FROM shifts WHERE employee_id = $1 AND is_released = TRUE';
      params = [req.user.userId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Release schedule (admin only)
app.post('/shifts/release', authenticate('admin'), async (req, res) => {
  const { shift_ids } = req.body; // Array of shift IDs to release
  try {
    await pool.query('UPDATE shifts SET is_released = TRUE WHERE id = ANY($1)', [shift_ids]);
    res.send('Schedule released');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error releasing schedule');
  }
});

// Request day off (employee only)
app.post('/daysoff', authenticate('employee'), async (req, res) => {
  const { date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO daysoff (employee_id, date) VALUES ($1, $2) RETURNING *',
      [req.user.userId, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error requesting day off');
  }
});

// Get days off (admin sees all, employees see their own)
app.get('/daysoff', authenticate(), async (req, res) => {
  try {
    let query;
    let params;
    if (req.user.role === 'admin') {
      query = 'SELECT d.*, u.name AS employee_name FROM daysoff d JOIN users u ON d.employee_id = u.id';
      params = [];
    } else {
      query = 'SELECT * FROM daysoff WHERE employee_id = $1';
      params = [req.user.userId];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
