# Database Setup Guide

## Quick Setup Steps

### 1. Go to your Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `feiirawejdfoscyejlfn`

### 2. Open SQL Editor
- In the left sidebar, click "SQL Editor"
- Click "New Query"

### 3. Run the Database Setup
- Copy all contents from `database-setup.sql`
- Paste into the SQL Editor
- Click "Run" button

### 4. Verify Tables Created
The script will show you a list of created tables at the end:
- `users`
- `admins` 
- `complaints`

### 5. Test Your Login
After running the SQL script:
- Go back to your deployed app
- Try logging in again
- The "Could not connect to server" error should be resolved

## What This Creates

### Users Table
- Stores student registration data
- Fields: firstname, lastname, regno, email, username, password

### Admins Table  
- Stores admin accounts
- Fields: fullname, username, email, password
- Default admin created: username: `admin`, password: `admin123`

### Complaints Table
- Stores all submitted complaints
- Fields: name, matric, email, complaint, category, status

## Security Settings
- Row Level Security (RLS) enabled
- Public access policies created (required for your app)
- Indexed for better performance

## Next Steps
1. Run the SQL script in Supabase
2. Test login functionality 
3. Register a new user to verify everything works
4. Submit a test complaint
5. Login as admin to view complaints dashboard