const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION,
});

module.exports = { s3Client };
