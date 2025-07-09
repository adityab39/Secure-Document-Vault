const s3 = require('../services/s3-service');  // Import the S3 configuration
const { v4: uuidv4 } = require('uuid'); // To generate unique file names


// Set up multer (in-memory storage, so files are not saved locally)


const uploadDocument = (req, res) => {
  const file = req.file;
  const fileName = uuidv4() + '-' + file.originalname; // Unique file name

  // Set up S3 upload parameters
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,  // Replace with your S3 bucket name
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
     // Or 'private', depending on your use case
  };

  // Upload the file to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading file: ', err);
      return res.status(500).send({ message: 'Failed to upload file', error: err });
    }
    res.status(200).send({
      message: 'File uploaded successfully',
      fileUrl: data.Location // S3 URL for the uploaded file
    });
  });
};

module.exports = {uploadDocument}

