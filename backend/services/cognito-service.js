const AWS = require('../config/aws-config');
const crypto = require('crypto');

const cognito = new AWS.CognitoIdentityServiceProvider();

function generateSecretHash(username) {
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  return crypto.createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

const registerUser = async (email, password) => {
  const secretHash = generateSecretHash(email); 

  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    SecretHash: secretHash,               
    UserAttributes: [
      { Name: 'email', Value: email }
    ]
  };

  try {
    const data = await cognito.signUp(params).promise();
    return data;
  } catch (err) {
    throw new Error(err);
  }
};

const authenticateUser = async (email, password) => {
  const secretHash = generateSecretHash(email); 

  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      SECRET_HASH: secretHash              
    }
  };

  try {
    const data = await cognito.initiateAuth(params).promise();
    return data.AuthenticationResult;
  } catch (err) {
    throw new Error(err);
  }
};

const confirmUser = async (email, confirmationCode) => {
  const secretHash = generateSecretHash(email);
  const params = {
    ClientId: process.env.COGNITO_CLIENT_ID,   
    Username: email,
    ConfirmationCode: confirmationCode,
    SecretHash: secretHash         
  };

  try {
    const data = await cognito.confirmSignUp(params).promise();
    return data;
  } catch (err) {
    throw new Error(err);
  }
};




module.exports = { registerUser, authenticateUser, confirmUser };
