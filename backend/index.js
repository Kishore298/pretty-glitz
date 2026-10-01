require('dotenv').config();
const dns = require("node:dns");

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const adminAuthRoutes = require('./routes/adminAuthRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Connect to database
connectDB();

// Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/subcategories', require('./routes/subcategoryRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Basic Route
app.get('/api', (req, res) => {
  res.send('PrettyGlitz API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
