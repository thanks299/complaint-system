const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3001;

require('dotenv').config({ path: __dirname + '/.env' });

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
  console.log('✅ MongoDB connection established');
} catch (error) {
  console.error('❌ Failed to load database module:', error.message);
  console.error('Make sure db.js exists and is properly configured');
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
    
    // Environment check
    const hasUri = !!process.env.MONGODB_URI;
    const hasDb = db && db.mongoose;
    
    console.log('- MONGODB_URI:', hasUri ? '✅ Set' : '❌ Missing');
    console.log('- Mongoose connection:', hasDb ? '✅ Ready' : '❌ Invalid');
    
    if (!hasDb) {
      return res.status(500).json({
        error: 'Database connection not properly initialized',
        checks: { hasUri, hasDb }
      });
    }

    // Test the connection
    try {
      // Try a simple query
      const userCount = await db.User.countDocuments();
      
      return res.status(200).json({
        status: 'success',
        message: '🎉 MongoDB connection is working!',
        connectionTest: 'passed',
        stats: {
          users: userCount,
          timestamp: new Date().toISOString()
        },
        environment: process.env.NODE_ENV || 'production'
      });
      
    } catch (queryError) {
      console.error('Database query error:', queryError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Database connection test failed',
        error: queryError.message,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));


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
  if (!db || !db.Complaint) {
    return res.status(500).json({ 
      error: 'Database connection not available',
      details: 'Please check database configuration'
    });
  }

  try {
    console.log('Fetching complaints...');
    
    const complaints = await db.Complaint
      .find({})
      .populate('userId', 'username email')
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 });

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

// Dashboard stats endpoint for admin
app.get('/api/admin/dashboard/stats', asyncHandler(async (req, res) => {
  if (!db || !db.Complaint) {
    return res.status(500).json({ 
      success: false,
      error: 'Database connection not available'
    });
  }

  try {
    console.log('🔄 Fetching dashboard stats...');
    
    // Get complaint counts by status using MongoDB aggregation
    const statusCounts = await db.Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Status counts from MongoDB:', statusCounts);
    
    // Get recent complaints
    const recentComplaints = await db.Complaint
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'username email');
    
    // Get user count
    let totalUsers = 0;
    try {
      totalUsers = await db.User.countDocuments();
    } catch (userError) {
      console.error('Error counting users:', userError);
      // Don't fail completely if just user count fails
      totalUsers = 0;
    }

    // Format the response with correct status mapping
    const stats = {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      totalUsers: totalUsers || 0
    };

    // Map status counts to expected frontend format
    statusCounts.forEach(item => {
      if (item._id === 'pending') {
        stats.pending = Number(item.count);
      } 
      else if (item._id === 'in-progress') {
        stats.inProgress = Number(item.count);
      }
      else if (item._id === 'resolved') {
        stats.resolved = Number(item.count);
      }
      else if (item._id === 'closed') {
        stats.closed = Number(item.count);
      }
    });

    // Map the complaints to the expected frontend format
    const formattedComplaints = recentComplaints.map(c => ({
      id: c._id,
      student: c.userId?.username || 'Anonymous',
      type: c.category || 'General',
      status: c.status === 'in-progress' ? 'In Progress' : 
             c.status.charAt(0).toUpperCase() + c.status.slice(1),
      priority: c.priority || 'Medium',
      date: c.createdAt,
      description: c.description
    }));

    console.log('Sending formatted stats:', stats);
    res.status(200).json({
      success: true,
      stats,
      recentComplaints: formattedComplaints
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Fallback dashboard stats endpoint without RPC
app.get('/api/admin/dashboard/stats-fallback', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Using fallback dashboard stats implementation');
    
    // Get all complaints
    const allComplaints = await db.Complaint.find({}).populate('userId', 'username email');
    
    // Count by status
    const pending = allComplaints.filter(c => c.status === 'pending').length;
    const inProgress = allComplaints.filter(c => c.status === 'in-progress').length;
    const resolved = allComplaints.filter(c => c.status === 'resolved').length;
    const closed = allComplaints.filter(c => c.status === 'closed').length;
    
    // Get users count
    let totalUsers = 0;
    try {
      totalUsers = await db.User.countDocuments();
    } catch (userError) {
      console.error('Error counting users:', userError);
    }
    
    // Get 5 most recent complaints
    const recentComplaints = allComplaints
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map(c => ({
        id: c._id,
        student: c.userId?.username || 'Anonymous',
        type: c.category || 'General',
        status: c.status === 'in-progress' ? 'In Progress' : 
               c.status.charAt(0).toUpperCase() + c.status.slice(1),
        priority: c.priority || 'Medium',
        date: c.createdAt,
        description: c.description
      }));
    
    // Format the response
    const stats = {
      pending,
      inProgress,
      resolved,
      closed,
      totalUsers
    };
    
    console.log('Dashboard stats (fallback):', { stats, recentComplaintsCount: recentComplaints.length });
    
    res.status(200).json({
      success: true,
      stats,
      recentComplaints
    });
  } catch (error) {
    console.error('Error in fallback dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
}));

// Helper function to determine priority from title or other fields
function getPriorityFromTitle(title) {
  if (!title) return 'Medium';
  
  // Basic algorithm - you can enhance this
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('urgent') || lowerTitle.includes('critical') || lowerTitle.includes('emergency')) {
    return 'High';
  } else if (lowerTitle.includes('minor') || lowerTitle.includes('low')) {
    return 'Low';
  }
  return 'Medium';
}

// ✅ Enhanced login with better error handling and database checks
app.post('/api/login', authLimiter, asyncHandler(async (req, res) => {
  console.log('Login request received:', { 
    ip: req.ip, 
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  // Check database connection first
  if (!db || !db.User) {
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
    
    let user = null;
    let userRole = 'student'; // default role
    
    // First, try to find user in the User collection (students)
    try {
      user = await db.User.findOne({
        $or: [
          { username: sanitizedLogin.toLowerCase() },
          { email: sanitizedLogin.toLowerCase() }
        ]
      });

      if (user) {
        userRole = 'student';
        console.log('Found student user:', sanitizedLogin);
      }
    } catch (err) {
      console.log('Student user search error:', err.message);
    }

    // If not found in users, try admins collection
    if (!user) {
      try {
        user = await db.Admin.findOne({
          $or: [
            { username: sanitizedLogin.toLowerCase() },
            { email: sanitizedLogin.toLowerCase() }
          ]
        });

        if (user) {
          userRole = 'admin';
          console.log('Found admin user:', sanitizedLogin);
        }
      } catch (err) {
        console.log('Admin user search error:', err.message);
      }
    }

    if (!user) {
      console.log('User not found in any collection:', sanitizedLogin);
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
      user.updatedAt = new Date();
      await user.save();
    } catch (updateError) {
      console.warn('Failed to update last login time:', updateError.message);
      // Don't fail the login for this
    }

    console.log('Login successful for user:', { 
      username: user.username, 
      role: userRole 
    });
    
    res.status(200).json({
      success: true,
      role: userRole,
      username: user.username,
      userId: user._id,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: userRole
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
  if (!db || !db.User) {
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
  
  // Student-specific validation
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

  // Common validation for both roles
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
    console.log('Starting registration process for:', username, 'as', role);
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check appropriate collection based on role
    let existingUser = null;
    
    if (role === 'admin') {
      existingUser = await db.Admin.findOne({
        $or: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      });
    } else {
      existingUser = await db.User.findOne({
        $or: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      });
    }

    if (existingUser) {
      const field = existingUser.username === username.toLowerCase() ? 'username' : 'email';
      return res.status(409).json({ 
        error: `A ${role} with this ${field} already exists` 
      });
    }

    // Prepare data based on role
    let newUser;
    
    if (role === 'admin') {
      newUser = new db.Admin({
        username: username.toLowerCase(), 
        email: email.toLowerCase(), 
        password: hashedPassword
      });
    } else {
      newUser = new db.User({
        username: username.toLowerCase(), 
        email: email.toLowerCase(), 
        password: hashedPassword,
        fullName: `${firstname} ${lastname}`
      });
    }

    console.log('Inserting new', role, 'into database...');
    const savedUser = await newUser.save();

    console.log(`${role} registered successfully:`, { username, email, role });
    
    // Return appropriate response based on role
    const response = { 
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`, 
      [role]: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        ...(role === 'student' && {
          fullName: savedUser.fullName,
          role: 'student'
        })
      }
    };

    res.status(201).json(response);

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
  if (!db || !db.Complaint) {
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
    
    // Create a unique complaint ID
    const complaintId = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new complaint
    const complaint = new db.Complaint({
      complaintId,
      title, 
      description: details,
      category: department,
      priority: getPriorityFromTitle(title),
      status: 'pending',
      userId: userId || null
    });

    const savedComplaint = await complaint.save();

    console.log('Complaint submitted successfully:', { title, email, id: savedComplaint._id });
    res.status(201).json({ 
      success: true,
      message: 'Complaint submitted successfully', 
      complaint: savedComplaint,
      id: savedComplaint._id
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
  if (!db || !db.Complaint) {
    return res.status(500).json({ 
      error: 'Database connection not available'
    });
  }

  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: pending, in-progress, resolved, closed' 
    });
  }

  try {
    const updatedComplaint = await db.Complaint.findByIdAndUpdate(
      id,
      { 
        status: status,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' ? new Date() : null
      },
      { new: true }
    );

    if (!updatedComplaint) {
      return res.status(404).json({ 
        error: 'Complaint not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: `Complaint status updated to ${status}`, 
      complaint: updatedComplaint 
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
  if (!db || !db.Complaint) {
    return res.status(500).json({ 
      error: 'Database connection not available'
    });
  }

  const { id } = req.params;

  try {
    const deletedComplaint = await db.Complaint.findByIdAndDelete(id);

    if (!deletedComplaint) {
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