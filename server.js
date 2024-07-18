const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
require('dotenv').config();
// const Routes = require('./routes/route.js');

const app = express();
const PORT = process.env.PORT

dotenv.config();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
// app.use('/', Routes);

// Test route
app.get('/', (req, res) => {
    res.send('Server is running!');
  });
// Start server
app.listen(PORT, () => {
  console.log(`Server started at port no. ${PORT}`);
});
