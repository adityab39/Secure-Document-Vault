// server.js
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth-router');
const s3Routes = require("./routes/s3-router")
require('dotenv').config();  // To use environment variables from .env file

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Load authentication routes
app.use('/auth', authRoutes);
app.use('/documents', s3Routes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
