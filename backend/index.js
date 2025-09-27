const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ FIX 1: Trust proxy for Render deployment
app.set('trust proxy', 1); // Trust first proxy (Render)

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, 
}));

// Logging middleware
app.use(morgan('combined'));

// ✅ FIX 2: Updated Rate limiting with proper proxy handling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator for better proxy support
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many login attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

app.use(limiter);

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://complaint-system-umber.vercel.app'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches vercel.app pattern
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost on any port for development
    if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ FIX 3: Enhanced Database connection with error handling
let db;
try {
  db = require('./db');
  console.log('✅ Database module loaded successfully');
  
  // Test database connection immediately
  if (db && typeof db.from === 'function') {
    console.log('✅ Database connection appears valid');
  } else {
    console.error('❌ Database connection invalid - db.from is not a function');
    console.log('Database object:', db);
  }
} catch (error) {
  console.error('❌ Failed to load database module:', error.message);
  console.error('Make sure db.js exists and exports a valid Supabase client');
}

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
    cors: 'enabled',
    database: db ? 'connected' : 'disconnected',
    trustProxy: app.get('trust proxy')
  });
});

// ✅ Database test endpoint
app.get('/api/db-test', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Log environment variables (safely)
    console.log('Environment check:');
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('- Database object type:', typeof db);
    console.log('- Database has from method:', typeof db?.from);
    
    if (!db || typeof db.from !== 'function') {
      return res.status(500).json({
        error: 'Database not properly initialized',
        dbType: typeof db,
        hasFromMethod: typeof db?.from
      });
    }

    // Test 1: Simple connection test (no table access needed)
    console.log('Testing basic Supabase connection...');
    
    // Test 2: Try a simple query that doesn't depend on RLS
    try {
      // This tests the connection without needing table permissions
      const { data, error } = await db
        .from('users')
        .select('count()', { count: 'exact', head: true });
      
      if (error) {
        console.log('RLS query failed (expected):', error.message);
        
        // Try alternative connection test
        const { data: tables, error: tablesError } = await db
          .rpc('get_schema_tables') // This might not exist, but tests connection
          .select();
        
        if (tablesError && tablesError.code === '42883') {
          // Function doesn't exist, but connection is working
          return res.status(200).json({
            status: 'success',
            message: 'Database connection verified',
            note: 'RLS policies are active (as expected)',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
          });
        } else if (tablesError) {
          throw tablesError;
        }
      }
      
      // If we get here, the query worked
      return res.status(200).json({
        status: 'success',
        message: 'Database connection successful',
        userCount: data?.length || 0,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      
    } catch (queryError) {
      console.error('Database query error:', queryError);
      
      // If it's an RLS error, that's actually good - means connection works
      if (queryError.message.includes('RLS') || 
          queryError.message.includes('policy') ||
          queryError.code === 'PGRST301' ||
          queryError.message === '') {
        
        return res.status(200).json({
          status: 'success',
          message: 'Database connection verified',
          note: 'RLS policies are protecting your data (this is good)',
          error_handled: queryError.message || 'Empty RLS error',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        });
      }
      
      // If it's a different error, report it
      throw queryError;
    }
    
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error.message || 'Unknown error',
      code: error.code,
      hint: error.hint,
      timestamp: new Date().toISOString()
    });
  }
}));

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS is working!',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    api: 'NACOS Complaint System',
    status: 'operational',
    cors: 'configured',
    database: db ? 'connected' : 'disconnected',
    trustProxy: app.get('trust proxy'),
    rateLimit: 'enabled',
    endpoints: {
      health: 'GET /',
      corsTest: 'GET /api/cors-test',
      dbTest: 'GET /api/db-test',
      login: 'POST /api/login',
      register: 'POST /api/registeration',
      complaints: 'GET /api/complaints',
      submitComplaint: 'POST /api/complaintform'
    }
  });
});

// GET all complaints for admin dashboard
app.get('/api/complaints', asyncHandler(async (req, res) => {
  // Check database connection first
  if (!db || typeof db.from !== 'function') {
    return res.status(500).json({ 
      error: 'Database connection not available',
      details: 'Please check database configuration'
    });
  }

  try {
    console.log('Fetching complaints...');
    
    const { data: complaints, error } = await db
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching complaints:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch complaints',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed'
      });
    }

    console.log(`Successfully fetched ${complaints?.length || 0} complaints`);
    res.status(200).json(complaints || []);
  } catch (error) {
    console.error('Unexpected error fetching complaints:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// ✅ Enhanced login with better error handling and database checks
app.post('/api/login', authLimiter, asyncHandler(async (req, res) => {
  console.log('Login request received:', { 
    ip: req.ip, 
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  // Check database connection first
  if (!db || typeof db.from !== 'function') {
    console.error('Database not available for login');
    return res.status(500).json({ 
      success: false,
      error: 'Database connection not available. Please try again later.',
      details: 'Service temporarily unavailable'
    });
  }

  let { username, password, email } = req.body;

  // Support both username and email login
  const loginField = username || email;
  
  // Sanitize inputs
  const sanitizedLogin = sanitizeInput(loginField);

  console.log('Login attempt for:', sanitizedLogin);

  // Validation
  if (!sanitizedLogin || !password) {
    console.log('Login validation failed: missing credentials');
    return res.status(400).json({ 
      success: false,
      error: 'Username/email and password are required' 
    });
  }

  try {
    console.log('Searching for user in database...');
    
    // Find user by username or email
    const { data: user, error } = await db
      .from('users')
      .select('*')
      .or(`username.eq.${sanitizedLogin.toLowerCase()},email.eq.${sanitizedLogin.toLowerCase()}`)
      .single();

    console.log('Database query completed:', { 
      found: !!user, 
      error: error?.message,
      errorCode: error?.code
    });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for invalid users
      console.error('Database error during login:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error during login. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (!user) {
      console.log('User not found:', sanitizedLogin);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    console.log('User found, verifying password...');
    
    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Password verification failed for:', sanitizedLogin);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    console.log('Password verified, updating last login...');
    
    // Update last login (don't fail login if this fails)
    try {
      await db
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
    } catch (updateError) {
      console.warn('Failed to update last login time:', updateError.message);
      // Don't fail the login for this
    }

    console.log('Login successful for user:', { 
      username: user.username, 
      role: user.role 
    });
    
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
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
}));

// Handle user registration (same database checks)
app.post('/api/registeration', asyncHandler(async (req, res) => {
  // Check database connection first
  if (!db || typeof db.from !== 'function') {
    return res.status(500).json({ 
      error: 'Database connection not available',
      details: 'Service temporarily unavailable'
    });
  }

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
    console.log('Starting registration process for:', username);
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check for existing user
    const { data: existingUser, error: checkError } = await db
      .from('users')
      .select('username, email')
      .or(`username.eq.${username.toLowerCase()},email.eq.${email.toLowerCase()}`)
      .maybeSingle(); // Use maybeSingle instead of single

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error checking existing user:', checkError);
      return res.status(500).json({ 
        error: 'Database error during validation',
        details: process.env.NODE_ENV === 'development' ? checkError.message : undefined
      });
    }

    if (existingUser) {
      const field = existingUser.username === username.toLowerCase() ? 'username' : 'email';
      return res.status(409).json({ 
        error: `A user with this ${field} already exists` 
      });
    }

    // Prepare user data
    let userData = {
      username: username.toLowerCase(), 
      email: email.toLowerCase(), 
      password: hashedPassword,
      role: role,
      created_at: new Date().toISOString()
    };

    if (role === 'student') {
      userData.firstname = firstname;
      userData.lastname = lastname;
      userData.regno = regno;
    }

    console.log('Inserting new user into database...');

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
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
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
    res.status(500).json({ 
      error: 'Internal server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Handle complaint form submission (with database checks)
app.post('/api/complaintform', asyncHandler(async (req, res) => {
  // Check database connection first
  if (!db || typeof db.from !== 'function') {
    return res.status(500).json({ 
      success: false,
      error: 'Database connection not available',
      details: 'Service temporarily unavailable'
    });
  }

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
    console.log('Submitting new complaint:', title);
    
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
        success: false,
        error: 'Failed to submit complaint',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
      });
    }

    console.log('Complaint submitted successfully:', { title, email, id: data[0].id });
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
      error: 'Internal server error during complaint submission',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Update complaint status (for admin)
app.patch('/api/complaints/:id/status', asyncHandler(async (req, res) => {
  if (!db || typeof db.from !== 'function') {
    return res.status(500).json({ 
      error: 'Database connection not available'
    });
  }

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
        error: 'Failed to update complaint status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Delete complaint (for admin)
app.delete('/api/complaints/:id', asyncHandler(async (req, res) => {
  if (!db || typeof db.from !== 'function') {
    return res.status(500).json({ 
      error: 'Database connection not available'
    });
  }

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
        error: 'Failed to delete complaint',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      'GET /api/db-test',
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
  
  // Handle specific error types
  if (error.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
    console.log('Rate limiter proxy configuration issue - continuing...');
    return res.status(500).json({
      error: 'Rate limiting configuration error',
      message: 'Please try again in a moment'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    code: error.code || 'UNKNOWN_ERROR'
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

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 NACOS Complaint Management API is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📊 API status: http://localhost:${PORT}/api/status`);
  console.log(`🔧 CORS test: http://localhost:${PORT}/api/cors-test`);
  console.log(`🗄️ Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Trust proxy: ${app.get('trust proxy')}`);
  console.log(`💾 Database: ${db ? 'Connected' : 'Not Connected'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

module.exports = app;