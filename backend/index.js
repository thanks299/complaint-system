const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

app.use(limiter);

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://complaint-system-nacos.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const db = require('./db');

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

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'NACOS Complaint Management API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    api: 'NACOS Complaint System',
    status: 'operational',
    endpoints: {
      health: 'GET /',
      login: 'POST /api/login',
      register: 'POST /api/registeration',
      adminRegister: 'POST /api/adminRegisteration',
      complaints: 'GET /api/complaints',
      submitComplaint: 'POST /api/complaintform'
    }
  });
});

// GET all complaints for admin dashboard
app.get('/api/complaints', asyncHandler(async (req, res) => {
  try {
    const { data: complaints, error } = await db
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching complaints:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch complaints',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(200).json(complaints || []);
  } catch (error) {
    console.error('Unexpected error fetching complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Handle user registration
app.post('/api/registeration', asyncHandler(async (req, res) => {
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

  try {
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check for existing user
    const { data: existingUser, error: checkError } = await db
      .from('users')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error checking existing user:', checkError);
      return res.status(500).json({ error: 'Database error during validation' });
    }

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
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
    const { data, error } = await db
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
}));

// Handle admin registration
// app.post('/api/adminRegisteration', asyncHandler(async (req, res) => {
//   let { username, email, password } = req.body;

//   // Sanitize inputs
//   username = sanitizeInput(username);
//   email = sanitizeInput(email);

//   // Validation
//   const errors = [];
  
//   if (!username || username.length < 3) {
//     errors.push('Username must be at least 3 characters long');
//   }
//   if (!email || !validateEmail(email)) {
//     errors.push('Please provide a valid email address');
//   }
//   if (!validatePassword(password)) {
//     errors.push('Password must be at least 6 characters long');
//   }

//   if (errors.length > 0) {
//     return res.status(400).json({ 
//       error: 'Validation failed', 
//       details: errors 
//     });
//   }

//   try {
//     // Hash password
//     const saltRounds = 12;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // Check for existing admin
//     const { data: existingAdmin, error: checkError } = await db
//       .from('users')
//       .select('username, email')
//       .or(`username.eq.${username},email.eq.${email}`)
//       .single();

//     if (checkError && checkError.code !== 'PGRST116') {
//       console.error('Database error checking existing admin:', checkError);
//       return res.status(500).json({ error: 'Database error during validation' });
//     }

//     if (existingAdmin) {
//       const field = existingAdmin.username === username ? 'username' : 'email';
//       return res.status(409).json({ 
//         error: `An admin with this ${field} already exists` 
//       });
//     }

//     // Insert new admin
//     const { data, error } = await db
//       .from('users')
//       .insert([{ 
//         username: username.toLowerCase(), 
//         email: email.toLowerCase(), 
//         password: hashedPassword,
//         role: 'admin',
//         created_at: new Date().toISOString()
//       }])
//       .select('id, username, email, role, created_at');

//     if (error) {
//       console.error('Supabase admin insert error:', error);
      
//       if (error.code === '23505') {
//         return res.status(409).json({ 
//           error: 'Admin already exists',
//           details: error.details
//         });
//       }
      
//       return res.status(500).json({ 
//         error: 'Failed to create admin account',
//         details: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }

//     console.log('Admin registered successfully:', { username, email });
//     res.status(201).json({ 
//       message: 'Admin registered successfully', 
//       admin: data[0] 
//     });

//   } catch (error) {
//     console.error('Admin registration process error:', error);
//     res.status(500).json({ error: 'Internal server error during admin registration' });
//   }
// }));

// Handle login
app.post('/api/login', authLimiter, asyncHandler(async (req, res) => {
  let { username, password } = req.body;

  // Sanitize inputs
  username = sanitizeInput(username);

  // Validation
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required' 
    });
  }

  try {
    // Find user by username or email
    const { data: user, error } = await db
      .from('users')
      .select('*')
      .or(`username.eq.${username.toLowerCase()},email.eq.${username.toLowerCase()}`)
      .single();

    if (error || !user) {
      console.log('Login attempt failed - user not found:', username);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Login attempt failed - invalid password:', username);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Update last login
    await db
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    console.log('User logged in successfully:', { username: user.username, role: user.role });
    
    res.status(200).json({
      success: true,
      role: user.role,
      username: user.username,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login process error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
}));

// Handle complaint form submission
app.post('/api/complaintform', asyncHandler(async (req, res) => {
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

  try {
    // Insert new complaint
    const { data, error } = await db
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
      message: 'Complaint submitted successfully', 
      complaint: data[0] 
    });

  } catch (error) {
    console.error('Complaint submission process error:', error);
    res.status(500).json({ error: 'Internal server error during complaint submission' });
  }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/status',
      'GET /api/complaints',
      'POST /api/login',
      'POST /api/registeration',
      'POST /api/adminRegisteration',
      'POST /api/complaintform'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 NACOS Complaint Management API is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📊 API status: http://localhost:${PORT}/api/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;