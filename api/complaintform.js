const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Initialize Supabase client directly in each API function
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// CORS middleware
const corsHandler = cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://complaint-system-nacos.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    let { name, matric, email, department, title, details } = req.body;

    // Sanitize inputs
    name = sanitizeInput(name);
    matric = sanitizeInput(matric);
    email = sanitizeInput(email);
    department = sanitizeInput(department);
    title = sanitizeInput(title);
    details = sanitizeInput(details);

    // Validation
    const errors = [];
    
    if (!name || name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    if (!matric || matric.length < 3) {
      errors.push('Matric number must be at least 3 characters long');
    }
    if (!email || !validateEmail(email)) {
      errors.push('Please provide a valid email address');
    }
    if (!department || department.length < 2) {
      errors.push('Department must be at least 2 characters long');
    }
    if (!title || title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }
    if (!details || details.length < 10) {
      errors.push('Details must be at least 10 characters long');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    // Insert complaint into Supabase
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        name,
        matric,
        email: email.toLowerCase(),
        department,
        title,
        details,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Supabase complaint insert error:', error);
      return res.status(500).json({ 
        error: 'Failed to submit complaint',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log('Complaint submitted successfully:', { title, email });
    res.status(201).json({ 
      success: true,
      message: 'Complaint submitted successfully', 
      complaint: data[0] 
    });

  } catch (error) {
    console.error('Complaint submission error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during complaint submission' 
    });
  }
}