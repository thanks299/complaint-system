const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
require('dotenv').config();

// Enable CORS for all origins (important for Vercel frontend)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Use Supabase database
const db = require('./db');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NACOS Complaint Management API is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// GET all complaints for admin dashboard
app.get('/api/complaints', async (req, res) => {
  try {
    const { data: complaints, error } = await db
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
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
    const { data: userRow } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userRow) {
      return res.status(400).json({ error: 'Email is already registered as a student.' });
    }
    
    // Check if email or username exists in admins
    const { data: adminRow } = await db
      .from('admins')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();
    
    if (adminRow) {
      return res.status(400).json({ error: 'Email or username is already registered as an admin.' });
    }
    
    const { data, error } = await db
      .from('admins')
      .insert([{ username, password, email }])
      .select();
    
    if (error) throw error;
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
    const { data: admin } = await db
      .from('admins')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .eq('password', password)
      .single();
    
    if (admin) {
      return res.json({ success: true, role: 'admin', username: admin.username });
    }
    
    // Check user
    const { data: user } = await db
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${username}`)
      .eq('password', password)
      .single();
    
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
    const { data, error } = await db
      .from('complaints')
      .insert([{
        name,
        matric,
        email,
        department,
        title,
        details,
        status: status || 'pending',
        date: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    res.json({ 
      message: 'Complaint submitted successfully', 
      complaint: data[0]
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Handle user registration form submission
app.post('/api/registeration', async (req, res) => {
  const { firstname, lastname, regno, email, username, password } = req.body;
  if (!firstname || !lastname || !regno || !email || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Check if email exists in admins
    const { data: adminRow } = await db
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    
    if (adminRow) {
      return res.status(400).json({ error: 'Email is already registered as an admin.' });
    }
    
    // Check if email or username exists in users
    const { data: userRow } = await db
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();
    
    if (userRow) {
      return res.status(400).json({ error: 'Email or username is already registered as a student.' });
    }
    
    const { data, error } = await db
      .from('users')
      .insert([{ firstname, lastname, regno, email, username, password, role: 'user' }])
      .select();
    
    if (error) throw error;
    res.json({ message: 'User registered successfully', user: { username, email } });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400).json({ error: 'User registration failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`NACOS Complaint Management API is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
});

module.exports = app;