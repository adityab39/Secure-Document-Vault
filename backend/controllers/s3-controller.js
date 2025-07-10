const AWS = require('aws-sdk');
const s3 = require('../services/s3-service');  // Import the S3 configuration
const { v4: uuidv4 } = require('uuid'); // To generate unique file names
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'document_types';



const uploadDocument = (req, res) => {
  const file = req.file;
  const fileName = uuidv4() + '-' + file.originalname; 

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, 
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading file: ', err);
      return res.status(500).send({ message: 'Failed to upload file', error: err });
    }
    res.status(200).send({
      message: 'File uploaded successfully',
      fileUrl: data.Location 
    });
  });
};

const getDocumentTypes = async (req, res) => {
  try {
    const result = await dynamo.scan({ TableName: TABLE_NAME }).promise();

    const documentTypes = result.Items
      .filter(item => item.enabled !== false)
      .map(item => ({
        typeId: item.typeId,
        typeName: item.typeName,
        sampleImageUrl: item.sampleImageUrl || null,
        enabled: item.enabled || false,
      })).sort((a, b) => Number(a.typeId) - Number(b.typeId));

    res.status(200).json({ documentTypes });
  } catch (err) {
    console.error('Error fetching document types:', err);
    res.status(500).json({ error: 'Could not retrieve document types' });
  }
};

module.exports = {
  uploadDocument,
  getDocumentTypes
};

