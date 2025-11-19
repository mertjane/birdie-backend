import express from "express";
import cors from "cors";
import dotenv from "dotenv"

import userRoutes from "./src/routes/users.js";
import userInterestRoutes from "./src/routes/userInterest.js";
import userPhotosRoutes from "./src/routes/photos.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/user-interests', userInterestRoutes);
app.use("/api/photos", userPhotosRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🐦 Birdie Backend API',
    version: '1.0.0',
    endpoints: {
      createUser: 'POST /api/users',
      getUser: 'GET /api/users/:firebase_uid',
      updateUser: 'PUT /api/users/:firebase_uid',
      health: 'GET /api/users/health/check'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});


// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Birdie Backend running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
});