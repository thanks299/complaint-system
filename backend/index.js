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

// Enhanced CORS configuration - FIXED
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://complaint-system-umber.vercel.app',
      // Add more specific Vercel domains if needed
      'https://complaint-system-git-main-yourusername.vercel.app'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches vercel.app pattern
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost on any port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    const msg = `CORS policy does not allow access from origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Add explicit CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'https://complaint-system-umber.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

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
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    api: 'NACOS Complaint System',
    status: 'operational',
    cors: 'configured',
    endpoints: {
      health: 'GET /',
      corsTest: 'GET /api/cors-test',
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
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`, 
      user: data[0] 
    });

  } catch (error) {
    console.error('Registration process error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}));

// Handle login
app.post('/api/login', authLimiter, asyncHandler(async (req, res) => {
  let { username, password, email } = req.body;

  // Support both username and email login
  const loginField = username || email;
  
  // Sanitize inputs
  const sanitizedLogin = sanitizeInput(loginField);

  // Validation
  if (!sanitizedLogin || !password) {
    return res.status(400).json({ 
      success: false,
      error: 'Username/email and password are required' 
    });
  }

  try {
    // Find user by username or email
    const { data: user, error } = await db
      .from('users')
      .select('*')
      .or(`username.eq.${sanitizedLogin.toLowerCase()},email.eq.${sanitizedLogin.toLowerCase()}`)
      .single();

    if (error || !user) {
      console.log('Login attempt failed - user not found:', sanitizedLogin);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Login attempt failed - invalid password:', sanitizedLogin);
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
      userId: user.id,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
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
  let { name, matric, email, department, title, details, username, userId } = req.body;

  // Sanitize inputs
  name = sanitizeInput(name);
  matric = sanitizeInput(matric);
  email = sanitizeInput(email);
  department = sanitizeInput(department);
  title = sanitizeInput(title);
  details = sanitizeInput(details);
  username = sanitizeInput(username);

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
    const complaintData = { 
      name, 
      matric, 
      email: email.toLowerCase(), 
      department, 
      title, 
      details,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Add user info if provided
    if (username) complaintData.username = username;
    if (userId) complaintData.user_id = userId;

    const { data, error } = await db
      .from('complaints')
      .insert([complaintData])
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
      complaint: data[0],
      id: data[0].id
    });

  } catch (error) {
    console.error('Complaint submission process error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during complaint submission' 
    });
  }
}));

// Update complaint status (for admin)
app.patch('/api/complaints/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in-progress', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: pending, in-progress, resolved' 
    });
  }

  try {
    const { data, error } = await db
      .from('complaints')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error updating complaint status:', error);
      return res.status(500).json({ 
        error: 'Failed to update complaint status' 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Complaint not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: `Complaint status updated to ${status}`, 
      complaint: data[0] 
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Delete complaint (for admin)
app.delete('/api/complaints/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await db
      .from('complaints')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Database error deleting complaint:', error);
      return res.status(500).json({ 
        error: 'Failed to delete complaint' 
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Complaint not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Complaint deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      'GET /api/cors-test',
      'GET /api/complaints',
      'POST /api/login',
      'POST /api/registeration',
      'POST /api/complaintform',
      'PATCH /api/complaints/:id/status',
      'DELETE /api/complaints/:id'
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
  console.log(`🔧 CORS test: http://localhost:${PORT}/api/cors-test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS enabled for Vercel domains`);
});

module.exports = app;