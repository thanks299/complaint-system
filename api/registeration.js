const db = require('../backend/db');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstname, lastname, regno, email, username, password, role } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Insert new user
    await db.run(
      'INSERT INTO users (firstname, lastname, regno, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstname, lastname, regno, email, username, password, role || 'user']
    );
    
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}