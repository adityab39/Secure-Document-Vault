// /config/aws-config.js
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-2', // Your AWS region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Optional: set these in environment variables or config
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

module.exports = AWS;
