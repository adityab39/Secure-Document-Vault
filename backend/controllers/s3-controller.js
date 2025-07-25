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
  const { documentId, userId } = req.body; 
  const file = req.file; 

  if (!file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  try {
    const params = {
      TableName: USER_DOCUMENTS_TABLE,
      Key: { documentId, userId }
    };

    const result = await dynamo.get(params).promise();
    if (!result.Item) {
      return res.status(404).send({ message: 'Document not found' });
    }

    const existingDocument = result.Item;
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: existingDocument.s3Key  
    };

    await s3.deleteObject(deleteParams).promise();

    const fileName = uuidv4() + '-' + file.originalname; 
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME, 
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadData = await s3.upload(uploadParams).promise();
    const updateParams = {
      TableName: USER_DOCUMENTS_TABLE,
      Key: { documentId, userId }, 
      UpdateExpression: 'set #s3Url = :url, #s3Key = :key, uploadedAt = :uploadedAt',
      ExpressionAttributeNames: {
        '#s3Url': 's3Url',
        '#s3Key': 's3Key',
      },
      ExpressionAttributeValues: {
        ':url': uploadData.Location, 
        ':key': fileName,          
        ':uploadedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW'
    };

    await dynamo.update(updateParams).promise();

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

const downloadDocument = async (req, res) => {
  const email = req.user.email;
  const documentId = req.query.documentId;

  try {
    const user = await getUserFromDb(email);
    const userId = user.userId;

    const params = {
      TableName: USER_DOCUMENTS_TABLE,
      Key: { documentId, userId }
    };

    const result = await dynamo.get(params).promise();
    if (!result.Item) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const s3Key = result.Item.s3Key;
    const fileName = s3Key.split('/').pop();

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    };

    const url = s3.getSignedUrl('getObject', {
      ...s3Params,
      Expires: 60 
    });

    return res.redirect(url);

  } catch (err) {
    console.error('Error downloading document:', err);
    return res.status(500).json({ message: 'Failed to download document', error: err.message });
  }
};

module.exports = {
  uploadDocument,
  getDocumentTypes,
  deleteDocument,
  getUserDocuments,
  updateDocument,
  downloadDocument,
};

