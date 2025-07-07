// /services/dynamoDBService.js
const AWS = require('../config/aws-config');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const saveUserMetadata = async (email, name) => {
  const params = {
    TableName: 'users',
    Item: {
      email: email,
      name: name,
      registeredAt: new Date().toISOString(),
    }
  };

  try {
    //timepass
    await dynamoDB.put(params).promise();
    return { message: 'User metadata saved successfully' };
  } catch (err) {
    console.log(err);
    throw new Error('Error saving user metadata:', err);
  }
};

module.exports = { saveUserMetadata };
