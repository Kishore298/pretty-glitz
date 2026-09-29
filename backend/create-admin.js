require('dotenv').config();
const dns = require("node:dns");

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB Connected');
};

const createAdmin = async () => {
  try {
    await connectDB();
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin already exists');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await User.create({
      role: 'admin',
      username: 'admin',
      password: hashedPassword
    });

    console.log('Admin created successfully.');
    console.log('Username: admin');
    console.log('Password: password123');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
