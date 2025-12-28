# MongoDB Setup Guide for Complaint System

This guide will help you set up MongoDB for the complaint system. You have two options: **Local MongoDB** or **MongoDB Atlas (Cloud)**.

## Option 1: Local MongoDB Setup

### Prerequisites
- Install MongoDB Community Edition from [mongodb.com/download](https://www.mongodb.com/try/download/community)

### Windows Installation
1. Download MongoDB Community Edition installer
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a Windows Service by default
4. Verify installation by opening Command Prompt and running:
   ```bash
   mongosh
   ```

### Mac Installation
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux Installation (Ubuntu)
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Configuration
1. Edit `.env` in the `backend` folder:
   ```env
   MONGODB_URI=mongodb://localhost:27017/complaint-system
   NODE_ENV=production
   PORT=3001
   ```

2. Ensure MongoDB service is running:
   - **Windows**: MongoDB Service should auto-start
   - **Mac**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

---

## Option 2: MongoDB Atlas (Cloud) Setup

### Steps

#### 1. Create MongoDB Atlas Account
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Click "Start free"
- Sign up with your email

#### 2. Create a Cluster
- After login, click "Create a Deployment"
- Select **Free** tier
- Choose your preferred cloud provider (AWS, Google Cloud, Azure)
- Select a region close to you
- Click "Create Deployment"
- Set a username and password for your database
- Save these credentials securely

#### 3. Get Connection String
- In the Atlas dashboard, click "Databases"
- Click "Connect" on your cluster
- Select "Drivers"
- Copy the connection string
- It should look like: `mongodb+srv://username:password@cluster-name.mongodb.net/complaint-system?retryWrites=true&w=majority`

#### 4. Update Environment Variables
1. Edit `.env` in the `backend` folder:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/complaint-system?retryWrites=true&w=majority
   NODE_ENV=production
   PORT=3001
   ```

2. Replace:
   - `your-username` with your MongoDB username
   - `your-password` with your MongoDB password
   - `your-cluster` with your cluster name (e.g., `cluster0.mongodb.net`)

#### 5. Configure Network Access
- In MongoDB Atlas, go to "Network Access"
- Click "Add IP Address"
- Select "Allow access from anywhere" for development, or
- Add your specific IP address for production
- Click "Confirm"

---

## Verify Installation

### Test Local MongoDB Connection
```bash
cd backend
npm install
npm start
```

Visit `http://localhost:3001/api/db-test` in your browser. You should see:
```json
{
  "status": "success",
  "message": "🎉 MongoDB connection is working!",
  "connectionTest": "passed"
}
```

### Troubleshooting

#### Connection Refused Error
- **Local**: Make sure MongoDB service is running
  - Windows: Check Services app for "MongoDB"
  - Mac: Run `brew services start mongodb-community`
  - Linux: Run `sudo systemctl status mongod`

#### Authentication Failed Error (Atlas)
- Verify username and password in connection string
- Check that your IP is whitelisted in Network Access
- Ensure database user has proper permissions

#### Cannot Connect to Database
- Check `.env` file has correct `MONGODB_URI`
- Verify MongoDB service is running
- Check firewall settings (especially for cloud deployments)
- Test connection with MongoDB Compass or `mongosh`

---

## MongoDB Compass (GUI Tool)

### Install
- Download from [mongodb.com/products/tools/compass](https://www.mongodb.com/products/tools/compass)
- Install and launch

### Connect
- **Local**: `mongodb://localhost:27017`
- **Atlas**: Use your connection string from the "Drivers" section

### Explore Data
- View databases, collections, and documents
- Insert, update, and delete data
- Monitor query performance

---

## Collections Schema

The system uses three MongoDB collections:

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  fullName: String,
  phone: String,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Admins Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'super-admin']),
  createdAt: Date,
  updatedAt: Date
}
```

### Complaints Collection
```javascript
{
  _id: ObjectId,
  complaintId: String (unique),
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  priority: String (enum: ['low', 'medium', 'high']),
  status: String (enum: ['pending', 'in-progress', 'resolved', 'closed']),
  attachments: [String],
  location: String,
  assignedTo: ObjectId (ref: Admin),
  resolution: String,
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date (nullable)
}
```

---

## Next Steps

1. Install dependencies: `npm install`
2. Start the backend: `npm start`
3. Test endpoints with Postman or Insomnia
4. Deploy to production using your choice of platform

---

## Recommended Deployment Platforms

- **Backend**: Heroku, Render, Railway, AWS EC2
- **Database**: MongoDB Atlas (recommended for simplicity)

---

**Need Help?**
- MongoDB Docs: [docs.mongodb.com](https://docs.mongodb.com)
- Mongoose Docs: [mongoosejs.com](https://mongoosejs.com)
- Issue Tracker: GitHub Issues
