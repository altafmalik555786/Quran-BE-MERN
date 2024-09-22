const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('dotenv').config();
const connectDB = require('./config/db');
const studentRoutes = require('./routes/routes');
const tutorRoutes = require('./routes/tutorRoutes');
const path = require("path");

// Serve the 'uploads' folder


const app = express();
const PORT = process.env.PORT

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
dotenv.config();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/v1', studentRoutes);
app.use('/api/v1/tutor', tutorRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});
// Start server
app.listen(PORT, () => {
  console.log(`Server started at port no. ${PORT}`);
});
