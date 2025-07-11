const AWS = require('aws-sdk');
const s3 = require('../services/s3-service');  
const { v4: uuidv4 } = require('uuid'); 
const dynamo = new AWS.DynamoDB.DocumentClient();
const DOCUMENT_TYPES_TABLE = 'document_types';
const USER_DOCUMENTS_TABLE = 'user_documents';
const url = require('url');  
const { getUserFromDb } = require('../services/dynamoDb-service');




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

const deleteDocument = async (req, res) => {
  const email = req.user.email;
  const documentId = req.query.documentId;
  const { s3Key } = req.body;

  console.log(`Email: ${email}, Document ID: ${documentId}, S3 Key: ${s3Key}`);

  if (!email || !documentId || !s3Key) {
    return res.status(400).json({ error: 'Missing email, documentId, or s3Key' });
  }

  try {
    const user = await getUserFromDb(email);
    const userId = user.userId;

    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key
    }).promise();

    await dynamo.delete({
      TableName: 'user_documents',
      Key: {
        userId,
        documentId
      }
    }).promise();

    res.status(200).json({ message: 'Document deleted successfully' });

  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: 'Failed to delete document', error: err.message });
  }
};


const updateDocument = async (req, res) => {
  const { documentId, userId } = req.body;  // Assuming documentId and userId are provided in the request
  const file = req.file;  // The new file to upload

  if (!file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  try {
    // Step 1: Retrieve the existing document from DynamoDB
    const params = {
      TableName: USER_DOCUMENTS_TABLE,
      Key: { documentId, userId }  // Using documentId and userId to find the document
    };

    const result = await dynamo.get(params).promise();
    if (!result.Item) {
      return res.status(404).send({ message: 'Document not found' });
    }

    const existingDocument = result.Item;

    // Step 2: Delete the old file from S3
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: existingDocument.s3Key  // Use the existing S3 key for deletion
    };

    await s3.deleteObject(deleteParams).promise();

    // Step 3: Upload the new file to S3
    const fileName = uuidv4() + '-' + file.originalname;  // Generate a unique file name
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME, 
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadData = await s3.upload(uploadParams).promise();

    // Step 4: Update the document metadata in DynamoDB
    const updateParams = {
      TableName: USER_DOCUMENTS_TABLE,
      Key: { documentId, userId },  // Use the documentId and userId to find the record
      UpdateExpression: 'set #s3Url = :url, #s3Key = :key, uploadedAt = :uploadedAt',
      ExpressionAttributeNames: {
        '#s3Url': 's3Url',
        '#s3Key': 's3Key',
      },
      ExpressionAttributeValues: {
        ':url': uploadData.Location,  // New S3 URL
        ':key': fileName,             // New S3 Key
        ':uploadedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW'
    };

    await dynamo.update(updateParams).promise();

    // Step 5: Return success response
    res.status(200).send({
      message: 'Document updated successfully',
      newDocument: {
        documentId,
        userId,
        typeId: existingDocument.typeId,
        typeName: existingDocument.typeName,
        s3Url: uploadData.Location,
        s3Key: fileName,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Error updating document: ', err);
    res.status(500).send({ message: 'Failed to update document', error: err.message });
  }
};

module.exports = {
  uploadDocument,
  getDocumentTypes,
  deleteDocument,
  getUserDocuments,
  updateDocument,
};

