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

  if (req.method === 'GET') {
    try {
      const complaints = await db.all('SELECT * FROM complaints ORDER BY created_at DESC');
      res.json(complaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else if (req.method === 'POST') {
    const { name, matric, email, complaint, category } = req.body;
    
    try {
      await db.run(
        'INSERT INTO complaints (name, matric, email, complaint, category, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [name, matric, email, complaint, category, new Date().toISOString()]
      );
      
      res.json({ success: true, message: 'Complaint submitted successfully' });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      res.status(500).json({ error: 'Failed to submit complaint' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}