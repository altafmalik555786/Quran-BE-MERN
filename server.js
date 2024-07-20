const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
require('dotenv').config();
const studentRoutes = require('./routes/routes');

const app = express();
const PORT = process.env.PORT

dotenv.config();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/v1', studentRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Server is running!');
  });
// Start server
app.listen(PORT, () => {
  console.log(`Server started at port no. ${PORT}`);
});
