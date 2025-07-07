// server.js
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth-router');
require('dotenv').config();  // To use environment variables from .env file

const app = express();
const port = 5000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Load authentication routes
app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
