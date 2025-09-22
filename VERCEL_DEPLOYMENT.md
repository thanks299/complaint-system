# 🚀 Vercel Deployment Guide for NACOS Complaint Management System

## Prerequisites
- [Git](https://git-scm.com/) installed
- [Vercel Account](https://vercel.com/) (free)
- [Supabase Account](https://supabase.com/) (free)
- [GitHub Account](https://github.com/) (free)

## Step 1: Setup Supabase Database

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com/)
   - Click "New Project"
   - Choose organization and name your project
   - Set a strong database password
   - Wait for project setup to complete

2. **Create Database Tables**
   ```sql
   -- Users Table
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     firstname VARCHAR(100) NOT NULL,
     lastname VARCHAR(100) NOT NULL,
     regno VARCHAR(50) UNIQUE NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     username VARCHAR(100) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role VARCHAR(20) DEFAULT 'user',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Admins Table
   CREATE TABLE admins (
     id SERIAL PRIMARY KEY,
     fullname VARCHAR(200) NOT NULL,
     username VARCHAR(100) UNIQUE NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role VARCHAR(20) DEFAULT 'admin',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Complaints Table
   CREATE TABLE complaints (
     id SERIAL PRIMARY KEY,
     name VARCHAR(200) NOT NULL,
     matric VARCHAR(50) NOT NULL,
     email VARCHAR(255) NOT NULL,
     complaint TEXT NOT NULL,
     category VARCHAR(100),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **Get Supabase Credentials**
   - Go to Project Settings → API
   - Copy your `Project URL` and `anon public` key

## Step 2: Push Code to GitHub

1. **Initialize Git Repository**
   ```bash
   cd c:/Users/USER/Desktop/complaint-system
   git init
   git add .
   git commit -m "Initial commit - NACOS Complaint System"
   ```

2. **Create GitHub Repository**
   - Go to [GitHub](https://github.com/)
   - Click "New Repository"
   - Name: `nacos-complaint-system`
   - Keep it public or private
   - Don't initialize with README (already have files)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/nacos-complaint-system.git
   git branch -M main
   git push -u origin main
   ```

## Step 3: Deploy on Vercel

1. **Connect GitHub to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

2. **Configure Environment Variables**
   - In Vercel Dashboard, go to your project
   - Click "Settings" → "Environment Variables"
   - Add these variables:
     ```
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     NODE_ENV=production
     ```

3. **Redeploy**
   - Go to "Deployments"
   - Click "..." on latest deployment
   - Click "Redeploy"

## Step 4: Test Your Application

Your app will be available at: `https://your-project-name.vercel.app`

### Available Routes:
- **Login**: `https://your-project-name.vercel.app/`
- **Registration**: `https://your-project-name.vercel.app/registeration.html`
- **Admin Registration**: `https://your-project-name.vercel.app/adminRegistration.html`
- **Complaint Form**: `https://your-project-name.vercel.app/complaintform.html`
- **Admin Dashboard**: `https://your-project-name.vercel.app/admindashboard.html`

## Step 5: Testing the Deployment

1. **Test User Registration**
   - Go to registration page
   - Create a test user account
   - Check Supabase database for new entry

2. **Test Login**
   - Use created credentials to login
   - Should redirect to complaint form

3. **Test Admin Features**
   - Register an admin account
   - Login as admin
   - Should redirect to admin dashboard

## Troubleshooting

### Common Issues:

1. **API Endpoints Not Working**
   - Check environment variables are set correctly
   - Ensure Supabase URL and key are correct
   - Check Vercel function logs

2. **Database Connection Errors**
   - Verify Supabase credentials
   - Check if tables are created correctly
   - Ensure database is accessible

3. **Static Files Not Loading**
   - Check file paths in HTML
   - Ensure CSS/JS files are in correct directories
   - Verify Vercel routing configuration

### Vercel Logs:
- Go to Vercel Dashboard → Your Project → Functions
- Click on any API function to see logs
- Check for errors in real-time

## Domain Configuration (Optional)

1. **Custom Domain**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## Production Checklist

- ✅ Supabase database tables created
- ✅ Environment variables configured
- ✅ All API endpoints tested
- ✅ Frontend routes working
- ✅ Database operations successful
- ✅ Error handling working
- ✅ Mobile responsiveness confirmed

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify Supabase connection
3. Test API endpoints individually
4. Check browser console for errors

## Security Notes

- Never commit `.env` files to Git
- Use strong passwords for database
- Regularly update dependencies
- Monitor Vercel usage limits
- Set up proper CORS policies

---

**🎉 Congratulations!** Your NACOS Complaint Management System is now live on Vercel!