const AWS = require('aws-sdk');
const s3 = require('../services/s3-service');  
const { v4: uuidv4 } = require('uuid'); 
const dynamo = new AWS.DynamoDB.DocumentClient();
const DOCUMENT_TYPES_TABLE = 'document_types';
const USER_DOCUMENTS_TABLE = 'user_documents';
const url = require('url');  




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

const getDocumentTypes = async (req, res) => {
  try {
    const result = await dynamo.scan({ TableName: DOCUMENT_TYPES_TABLE }).promise();

    const documentTypes = result.Items
      .filter(item => item.enabled !== false)
      .map(item => {
        let objectKey = null;
        if (item.sampleImageUrl) {
          const parsedUrl = url.parse(item.sampleImageUrl);
          objectKey = parsedUrl.pathname.split('/').slice(2).join('/'); 
        }

        return {
          typeId: item.typeId,
          typeName: item.typeName,
          sampleImageUrl: item.sampleImageUrl || null,
          objectKey: objectKey,  
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

const getUserDocuments = async (req, res) => {
  const email = req.user.email;
  if (!email) return res.status(400).json({ error: 'Email not found in token' });

  try {
    const userResult = await dynamo.get({
      TableName: 'users',
      Key: { email }
    }).promise();

    if (!userResult.Item) {
      return res.status(404).json({ error: 'User not found in users table' });
    }

    const userId = userResult.Item.userId;

    const docsResult = await dynamo.query({
      TableName: 'user_documents',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId
      }
    }).promise();

    res.status(200).json({ documents: docsResult.Items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents', message: err.message });
  }
};

module.exports = {
  uploadDocument,
  getDocumentTypes,
  deleteDocument,
  getUserDocuments
};

