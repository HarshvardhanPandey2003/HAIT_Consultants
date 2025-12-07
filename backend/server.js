const express = require('express');
const cors = require('cors');
require('dotenv').config();

const enquiryRoutes = require('./routes/enquiries');
const scheduleRoutes = require('./routes/schedule'); 
const availabilityRoutes = require('./routes/availability'); 


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/schedule', scheduleRoutes); 
app.use('/api/availability', availabilityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HAIT Consultants API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database connected to ${process.env.DATABASE_URL.split('@')[1]}`);
});
