const supabase = require('./supabase-config');

// Database helper functions for Supabase
const db = {
  // Get all records from a table
  async all(query, params = []) {
    try {
      // For basic SELECT * queries
      if (query.includes('SELECT * FROM complaints')) {
        const { data, error } = await supabase
          .from('complaints')
          .select('*');
        if (error) throw error;
        return data;
      }
      throw new Error('Query not implemented yet');
    } catch (error) {
      throw error;
    }
  },

  // Get a single record
  async get(query, params = []) {
    try {
      if (query.includes('SELECT * FROM users WHERE email = ?')) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', params[0])
          .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        return data;
      }
      
      if (query.includes('SELECT * FROM admins WHERE username = ? OR email = ?')) {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .or(`username.eq.${params[0]},email.eq.${params[1]}`);
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
      }

      if (query.includes('SELECT * FROM users WHERE username = ? OR email = ?')) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq.${params[0]},email.eq.${params[1]}`);
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
      }

      if (query.includes('SELECT * FROM admins WHERE (username = ? OR email = ?) AND password = ?')) {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .or(`username.eq.${params[0]},email.eq.${params[0]}`)
          .eq('password', params[2]);
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
      }

      if (query.includes('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?')) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq.${params[0]},email.eq.${params[0]}`)
          .eq('password', params[2]);
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
      }

      throw new Error('Query not implemented yet');
    } catch (error) {
      throw error;
    }
  },

  // Insert or update records
  async run(query, params = []) {
    try {
      if (query.includes('INSERT INTO admins')) {
        const { data, error } = await supabase
          .from('admins')
          .insert([{
            username: params[0],
            password: params[1],
            email: params[2]
          }])
          .select()
          .single();
        if (error) throw error;
        return { lastID: data.id };
      }

      if (query.includes('INSERT INTO users')) {
        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: params[0],
            password: params[1],
            email: params[2],
            role: params[3]
          }])
          .select()
          .single();
        if (error) throw error;
        return { lastID: data.id };
      }

      if (query.includes('INSERT INTO complaints')) {
        const { data, error } = await supabase
          .from('complaints')
          .insert([{
            name: params[0],
            matric: params[1],
            email: params[2],
            department: params[3],
            title: params[4],
            details: params[5],
            status: params[6],
            date: params[7]
          }])
          .select()
          .single();
        if (error) throw error;
        return { lastID: data.id };
      }

      throw new Error('Query not implemented yet');
    } catch (error) {
      throw error;
    }
  }
};

module.exports = db;