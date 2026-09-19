const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/emergencies'); // fallback
const emergencyRoutes = require('./routes/emergencies');
const resourceRoutes = require('./routes/resources');
const resourceRequestRoutes = require('./routes/resourceRequests');
const hospitalRoutes = require('./routes/hospitals');
const shelterRoutes = require('./routes/shelters');
const weatherRoutes = require('./routes/weather');
const allocationRoutes = require('./routes/allocation');
const simulationRoutes = require('./routes/simulation');
const dashboardRoutes = require('./routes/dashboard');
const governmentRoutes = require('./routes/government');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RESQ backend'
  });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/resource-requests', resourceRequestRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api', allocationRoutes);
app.use('/api/simulate', simulationRoutes);

// Optional MongoDB Connection (Non-blocking)
if (process.env.MONGODB_URI) {
  try {
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('✅ Connected to MongoDB'))
      .catch(err => console.warn('⚠️ MongoDB connection deferred (using in-memory data store):', err.message));
  } catch (e) {
    console.warn('⚠️ Mongoose optional dependency not active, proceeding with in-memory data store.');
  }
}

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[RESQ Server Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start Server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 RESQ Backend running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
      console.error(`👉 Stop the process using port ${PORT} or change PORT in backend/.env`);
    } else {
      console.error('[RESQ Server Startup Error]:', err.message);
    }
  });
}

module.exports = app;
