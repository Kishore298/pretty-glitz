require('dotenv').config();
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
app.use('/api/customer/auth', require('./routes/customerAuthRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/subcategories', require('./routes/subcategoryRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Basic Route
app.get('/api', (req, res) => {
  res.send('PrettyGlitz API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
