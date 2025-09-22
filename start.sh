#!/bin/bash

# Complaint System Startup Script
echo "🚀 Starting NACOS Complaint Management System..."

# Check if .env is configured
if grep -q "your-supabase-project-url" .env; then
    echo "⚠️  Please configure your .env file with actual Supabase credentials"
    echo "📋 Edit .env file and replace:"
    echo "   - SUPABASE_URL with your Supabase project URL"
    echo "   - SUPABASE_ANON_KEY with your Supabase anon key"
    exit 1
fi

# Start the backend server
echo "🔧 Starting backend server on port 3001..."
npm start

echo "✅ Server running at http://localhost:3001"
echo "🌐 Access your application:"
echo "   - Login: http://localhost:3001/"
echo "   - Registration: http://localhost:3001/registeration"
echo "   - Admin Registration: http://localhost:3001/adminRegisteration"
echo "   - Admin Dashboard: http://localhost:3001/admindashboard"
echo "   - Complaint Form: http://localhost:3001/complaintform"