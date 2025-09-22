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

  const { fullname, username, email, password, role } = req.body;
  
  try {
    // Check if admin already exists
    const existingAdmin = await db.get('SELECT * FROM admins WHERE email = ? OR username = ?', [email, username]);
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    // Insert new admin
    await db.run(
      'INSERT INTO admins (fullname, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullname, username, email, password, role || 'admin']
    );
    
    res.json({ success: true, message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error during admin registration:', error);
    res.status(500).json({ error: 'Admin registration failed' });
  }
}