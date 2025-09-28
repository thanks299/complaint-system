const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const cors = require('cors');

// Initialize Supabase client
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

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
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
    let { firstname, lastname, regno, email, username, password, role } = req.body;

    // Sanitize inputs
    firstname = sanitizeInput(firstname);
    lastname = sanitizeInput(lastname);
    regno = sanitizeInput(regno);
    email = sanitizeInput(email);
    username = sanitizeInput(username);
    role = sanitizeInput(role);

    // Validation
    const errors = [];
    
    // Role-specific validation
    if (!role || !['student', 'admin'].includes(role)) {
      errors.push('Please select a valid role (student or admin)');
    }
    
    if (role === 'student') {
      if (!firstname || firstname.length < 2) {
        errors.push('First name must be at least 2 characters long');
      }
      if (!lastname || lastname.length < 2) {
        errors.push('Last name must be at least 2 characters long');
      }
      if (!regno || regno.length < 3) {
        errors.push('Registration number must be at least 3 characters long');
      }
    }

    if (!email || !validateEmail(email)) {
      errors.push('Please provide a valid email address');
    }
    if (!username || username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (!validatePassword(password)) {
      errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check for existing user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username, email')
      .or(`username.eq.${username.toLowerCase()},email.eq.${email.toLowerCase()}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error checking existing user:', checkError);
      return res.status(500).json({ error: 'Database error during validation' });
    }

    if (existingUser) {
      const field = existingUser.username === username.toLowerCase() ? 'username' : 'email';
      return res.status(409).json({ 
        error: `A user with this ${field} already exists` 
      });
    }

    // Prepare user data based on role
    let userData = {
      username: username.toLowerCase(), 
      email: email.toLowerCase(), 
      password: hashedPassword,
      role: role,
      created_at: new Date().toISOString()
    };

    // Add student-specific fields if role is student
    if (role === 'student') {
      userData.firstname = firstname;
      userData.lastname = lastname;
      userData.regno = regno;
    }

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id, firstname, lastname, username, email, role, created_at');

    if (error) {
      console.error('Supabase insert error:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'User already exists',
          details: error.details
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create user account',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log('User registered successfully:', { username, email, role });
    res.status(201).json({ 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`, 
      user: data[0] 
    });

  } catch (error) {
    console.error('Registration process error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}