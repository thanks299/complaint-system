const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url-here';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key-here';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;