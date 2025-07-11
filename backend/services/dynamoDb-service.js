const AWS = require('../config/aws-config');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

const saveUserMetadata = async (email, name) => {
  const params = {
    TableName: 'users',
    Item: {
      userId: uuidv4(),
      email: email,
      name: name,
      registeredAt: new Date().toISOString(),
    }
  };

  try {
    await dynamoDB.put(params).promise();
    return { message: 'User metadata saved successfully' };
  } catch (err) {
    throw new Error('Error saving user metadata:', err);
  }
};

const getUserInfo = async (email) => {
  const params = {
    TableName: 'users',
    Key: {
      email: email
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      throw new Error('User not found');
    }
    return result.Item;
  } catch (err) {
    throw new Error('Error fetching user info: ' + err.message);
  }
};

module.exports = { saveUserMetadata, getUserInfo };
