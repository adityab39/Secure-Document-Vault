const AWS = require('aws-sdk');
const s3 = require('../services/s3-service');  
const { v4: uuidv4 } = require('uuid'); 
const dynamo = new AWS.DynamoDB.DocumentClient();
const DOCUMENT_TYPES_TABLE = 'document_types';
const USER_DOCUMENTS_TABLE = 'user_documents';
const url = require('url');  // Import the 'url' module




const uploadDocument = (req, res) => {
  const file = req.file;
  const {userId, typeId, typeName} = req.body;
  
  if (!file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  if (!file || !userId || !typeId || !typeName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const fileName = uuidv4() + '-' + file.originalname;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, 
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  s3.upload(params, async(err, data) => {
    if (err) {
      console.error('Error uploading file: ', err);
      return res.status(500).send({ message: 'Failed to upload file', error: err });
    }
    const documentId = uuidv4();
    const dbParams = {
      TableName: USER_DOCUMENTS_TABLE,
      Item: {
        userId,
        documentId,
        typeId,
        typeName,
        s3Url: data.Location,
        s3Key: fileName,
        uploadedAt: new Date().toISOString()
      }
    };

    try {
      await dynamo.put(dbParams).promise();
      res.status(200).send({
        message: 'File uploaded and recorded successfully',
        document: dbParams.Item
      });
    } catch (dbErr) {
      console.error('Error saving metadata to DynamoDB: ', dbErr);
      res.status(500).send({ message: 'File uploaded but metadata save failed', error: dbErr });
    }
  });
};

// Function to get document types and extract the object key from the object URL
const getDocumentTypes = async (req, res) => {
  try {
    const result = await dynamo.scan({ TableName: DOCUMENT_TYPES_TABLE }).promise();

    const documentTypes = result.Items
      .filter(item => item.enabled !== false)
      .map(item => {
        // Extract the object key from the sampleImageUrl
        let objectKey = null;
        if (item.sampleImageUrl) {
          const parsedUrl = url.parse(item.sampleImageUrl);
          objectKey = parsedUrl.pathname.split('/').slice(2).join('/'); // Extract key from URL
        }

        return {
          typeId: item.typeId,
          typeName: item.typeName,
          sampleImageUrl: item.sampleImageUrl || null,
          objectKey: objectKey,  // Include the object key
          enabled: item.enabled || false,
        };
      })
      .sort((a, b) => Number(a.typeId) - Number(b.typeId));

    console.log(`This is the document types: ${documentTypes}`);
    res.status(200).json({ documentTypes });
  } catch (err) {
    console.error('Error fetching document types:', err);
    res.status(500).json({ error: 'Could not retrieve document types' });
  }
};


const deleteDocument = (req, res) => {
  const { fileName } = req.body; // The key (file name) of the document to be deleted

  // Set up S3 delete parameters
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,  // Your S3 bucket name
    Key: fileName,                       // The key (file name) of the file to be deleted
  };

  // Delete the file from S3
  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.error('Error deleting file: ', err);
      return res.status(500).send({ message: 'Failed to delete file', error: err });
    }
    res.status(200).send({
      message: 'File deleted successfully',
      data: data
    });
  });
};

module.exports = {
  uploadDocument,
  getDocumentTypes,
  deleteDocument
};

