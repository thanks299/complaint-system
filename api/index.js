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
}