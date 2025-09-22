require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));


// Serve main pages
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
app.get('/admindashboard', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'admindashboard.html'));
});
app.get('/adminRegisteration', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'adminRegistration.html'));
});
app.get('/complaintform', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'complaintform.html'));
});
app.get('/registeration', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'registeration.html'));
});


// Use SQLite database
const db = require('./db');

// Handle admin dashboard actions (e.g., get all complaints)

// GET all complaints for admin dashboard
app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await db.all('SELECT * FROM complaints');
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Handle admin registration form submission
app.post('/api/adminRegisteration', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Check if email exists in users
    const userRow = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (userRow) {
      return res.status(400).json({ error: 'Email is already registered as a student.' });
    }
    
    // Check if email or username exists in admins
    const adminRow = await db.get('SELECT * FROM admins WHERE username = ? OR email = ?', [username, email]);
    if (adminRow) {
      return res.status(400).json({ error: 'Email or username is already registered as an admin.' });
    }
    
    const result = await db.run('INSERT INTO admins (username, password, email) VALUES (?, ?, ?)', [username, password, email]);
    res.json({ message: 'Admin registered successfully', admin: { username, email } });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(400).json({ error: 'Admin registration failed.' });
  }
});

// Login endpoint: checks if user is registered and returns role
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check admin
    const admin = await db.get('SELECT * FROM admins WHERE (username = ? OR email = ?) AND password = ?', [username, username, password]);
    if (admin) {
      return res.json({ success: true, role: 'admin', username: admin.username });
    }
    
    // Check user
    const user = await db.get('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?', [username, username, password]);
    if (user) {
      return res.json({ success: true, role: 'user', username: user.username });
    }
    
    // Not registered
    return res.json({ success: false });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Handle complaint form submission
app.post('/api/complaintform', async (req, res) => {
  const { name, matric, email, department, title, details, status } = req.body;
  if (!name || !matric || !email || !department || !title || !details) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const result = await db.run('INSERT INTO complaints (name, matric, email, department, title, details, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, matric, email, department, title, details, status || 'Pending', new Date().toISOString()]);
    
    res.json({ 
      message: 'Complaint submitted successfully', 
      complaint: { 
        id: result.lastID, 
        name, 
        matric, 
        email, 
        department, 
        title, 
        details, 
        status: status || 'Pending', 
        date: new Date().toISOString() 
      } 
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Handle user registration form submission
app.post('/api/registeration', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Check if email exists in admins
    const adminRow = await db.get('SELECT * FROM admins WHERE email = ?', [email]);
    if (adminRow) {
      return res.status(400).json({ error: 'Email is already registered as an admin.' });
    }
    
    // Check if email or username exists in users
    const userRow = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (userRow) {
      return res.status(400).json({ error: 'Email or username is already registered as a student.' });
    }
    
    const result = await db.run('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)', [username, password, email, 'user']);
    res.json({ message: 'User registered successfully', user: { username, email } });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ error: 'User registration failed.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// module.exports = app;