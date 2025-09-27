const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Initializing Supabase connection...');

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL environment variable is not set');
  throw new Error('SUPABASE_URL is required');
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY environment variable is not set');
  throw new Error('SUPABASE_ANON_KEY is required');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'complaint-system-backend'
    }
  }
});

// Test the connection immediately
async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Database connection test successful');
      console.log('📊 User table accessible');
    }
  } catch (err) {
    console.error('❌ Database connection test error:', err.message);
  }
}

// Test connection when module loads (don't await to avoid blocking)
testConnection();

// Verify the client has required methods
console.log('🔍 Verifying Supabase client methods:');
console.log('- from method:', typeof supabase.from);
console.log('- auth method:', typeof supabase.auth);

if (typeof supabase.from !== 'function') {
  console.error('❌ Supabase client missing from() method');
  throw new Error('Invalid Supabase client - from() method not available');
}

console.log('✅ Supabase client initialized successfully');

module.exports = supabase;