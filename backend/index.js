require('dotenv').config();
const dns = require("node:dns");

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const adminAuthRoutes = require('./routes/adminAuthRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
initSocket(server);

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Connect to database
connectDB();

// Routes — existing (UNCHANGED)
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/products',   require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/subcategories', require('./routes/subcategoryRoutes'));
app.use('/api/upload',     require('./routes/uploadRoutes'));
app.use('/api/banners',    require('./routes/bannerRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));

// Routes — new customer features & orders
app.use('/api/customer/auth', require('./routes/customerAuthRoutes'));
app.use('/api/customer/whatsapp-auth', require('./routes/whatsappAuthRoutes'));
app.use('/api/cart',          require('./routes/cartRoutes'));
app.use('/api/wishlist',      require('./routes/wishlistRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));
app.use('/api/orders',        require('./routes/orderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Basic Route
app.get('/api', (req, res) => {
  res.send('PrettyGlitz API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
