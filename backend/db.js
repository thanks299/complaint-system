const mongoose = require('mongoose');
require('./mongodb-config');
const User = require('./models/User');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');

console.log('🔧 Loading MongoDB database module...');

// Export MongoDB models and utilities
module.exports = {
  User,
  Admin,
  Complaint,
  mongoose,

  // Legacy wrapper for backward compatibility
  legacy: {
    // Get all records from a collection
    async all(query, params = []) {
      try {
        if (query.includes('SELECT * FROM complaints')) {
          return await Complaint.find({});
        }
        if (query.includes('SELECT * FROM users')) {
          return await User.find({});
        }
        if (query.includes('SELECT * FROM admins')) {
          return await Admin.find({});
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
          return await User.findOne({ email: params[0] });
        }
        
        if (query.includes('SELECT * FROM admins WHERE username = ? OR email = ?')) {
          return await Admin.findOne({
            $or: [
              { username: params[0] },
              { email: params[1] }
            ]
          });
        }

        if (query.includes('SELECT * FROM users WHERE username = ? OR email = ?')) {
          return await User.findOne({
            $or: [
              { username: params[0] },
              { email: params[1] }
            ]
          });
        }

        if (query.includes('SELECT * FROM admins WHERE (username = ? OR email = ?) AND password = ?')) {
          return await Admin.findOne({
            $or: [
              { username: params[0] },
              { email: params[0] }
            ],
            password: params[2]
          });
        }

        if (query.includes('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?')) {
          return await User.findOne({
            $or: [
              { username: params[0] },
              { email: params[0] }
            ],
            password: params[2]
          });
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
          const admin = new Admin({
            username: params[0],
            password: params[1],
            email: params[2]
          });
          const saved = await admin.save();
          return { lastID: saved._id };
        }

        if (query.includes('INSERT INTO users')) {
          const user = new User({
            username: params[4],
            email: params[3],
            password: params[5],
            fullName: `${params[0]} ${params[1]}`
          });
          const saved = await user.save();
          return { lastID: saved._id };
        }

        if (query.includes('INSERT INTO complaints')) {
          const complaint = new Complaint({
            title: params[4],
            description: params[5],
            status: params[6],
            createdAt: params[7]
          });
          const saved = await complaint.save();
          return { lastID: saved._id };
        }

        throw new Error('Query not implemented yet');
      } catch (error) {
        throw error;
      }
    }
  }
};

console.log('✅ MongoDB database module loaded successfully');