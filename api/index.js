const cors = require('cors');

// CORS middleware
const corsHandler = cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://complaint-system-nacos.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

export default async function handler(req, res) {
  // Apply CORS
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  if (req.method === 'GET') {
    res.status(200).json({
      message: 'NACOS Complaint Management API is running!',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      endpoints: {
        health: 'GET /api',
        login: 'POST /api/login',
        register: 'POST /api/registeration',
        complaints: 'GET /api/complaints',
        submitComplaint: 'POST /api/complaintform'
      }
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
