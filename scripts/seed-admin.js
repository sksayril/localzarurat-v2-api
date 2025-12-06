require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

// Connect to database
mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI);

mongoose.connection
  .on('open', async () => {
    console.log('Database connected!');
    
    try {
      const email = 'admiintest@gmail.com';
      const password = 'admin123';
      const name = 'Admin Test';
      const phone = '9999999999'; // Default phone number
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email });
      
      if (existingAdmin) {
        console.log('Admin with email', email, 'already exists!');
        console.log('Updating password...');
        existingAdmin.password = password;
        await existingAdmin.save();
        console.log('Admin password updated successfully!');
        process.exit(0);
      }
      
      // Check if any admin exists
      const anyAdmin = await User.findOne({ role: 'admin' });
      
      // Create admin user
      const admin = new User({
        name,
        email,
        password,
        phone,
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        adminDetails: {
          permissions: ['all'], // Full permissions
          lastLogin: new Date(),
          createdBy: null,
          isSuperAdmin: !anyAdmin // First admin is super admin
        }
      });
      
      await admin.save();
      
      console.log('✅ Admin created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Name:', name);
      console.log('Role: admin');
      console.log('Is Super Admin:', !anyAdmin);
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error creating admin:', error.message);
      if (error.code === 11000) {
        console.error('Duplicate entry - Admin with this email or phone already exists');
      }
      process.exit(1);
    }
  })
  .on('error', (error) => {
    console.error('Connection failed:', error);
    process.exit(1);
  });

