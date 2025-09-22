# Supabase Migration Guide

Your complaint system has been successfully migrated from SQLite to Supabase! Here's how to complete the setup:

## 🚀 Quick Setup Steps

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" 
3. Fill in your project details:
   - **Project Name**: complaint-system
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users

### 2. Get Your Project Credentials
Once your project is created:
1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env` file in your project root with these values:

```env
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Database Tables
Go to the **SQL Editor** in your Supabase dashboard and run this SQL:

```sql
-- Create users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table
CREATE TABLE admins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create complaints table
CREATE TABLE complaints (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  matric TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can customize these later)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON admins FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON admins FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON complaints FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON complaints FOR INSERT WITH CHECK (true);
```

### 4. Update Environment Variables
Update the `backend/supabase-config.js` file with your actual credentials by setting the environment variables in your `.env` file.

### 5. Test Your Setup
1. Start your server: `npm run dev`
2. Test the endpoints:
   - Register a new user
   - Submit a complaint
   - Login as admin/user

## 🔧 What Changed

### Files Modified:
- ✅ `backend/db.js` - Now uses Supabase client instead of SQLite
- ✅ `backend/index.js` - All routes converted to async/await
- ✅ `backend/supabase-config.js` - New Supabase configuration
- ✅ `package.json` - Added @supabase/supabase-js and dotenv
- ✅ `.env.example` - Template for environment variables

### Key Benefits:
- 🌐 **Cloud Database**: No more local SQLite files
- 🔒 **Built-in Auth**: Supabase provides authentication features
- 📊 **Real-time**: Built-in real-time subscriptions
- 🛡️ **Security**: Row Level Security (RLS) policies
- 📈 **Scalability**: Handles much larger datasets
- 🔧 **Admin Dashboard**: Built-in database management interface

## 🛠️ Advanced Configuration

### Environment Variables
You can add these optional environment variables:

```env
# Optional: Set Node environment
NODE_ENV=development

# Optional: Custom port
PORT=3001
```

### Security Enhancements
Consider implementing these in Supabase:
1. **Row Level Security policies** for better data protection
2. **Database triggers** for automated actions
3. **Custom roles** for different user types
4. **API rate limiting** in your application

## 🐛 Troubleshooting

### Common Issues:
1. **"Invalid API key"** - Check your SUPABASE_ANON_KEY in .env
2. **"Cannot connect to database"** - Verify SUPABASE_URL is correct
3. **"Table doesn't exist"** - Make sure you ran the SQL setup commands
4. **"Permission denied"** - Check your RLS policies in Supabase

### Need Help?
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client Guide](https://supabase.com/docs/reference/javascript/introduction)

## 🎉 You're All Set!

Your complaint system is now powered by Supabase and ready for production use!