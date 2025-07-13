import crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

const cognitoClient = new CognitoIdentityProviderClient({ region: "us-east-2" });
const dynamoClient = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

function generateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

const getUserMetadata = async (email) => {
  const params = {
    TableName: "users",
    Key: { email }
  };

  const command = new GetCommand(params);
  const result = await docClient.send(command);
  return result.Item;
};

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;

    const secretHash = generateSecretHash(email, clientId, clientSecret);

    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    };

    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);

    const user = await getUserMetadata(email);
    const userId = user?.userId || null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Login successful",
        authResponse: response.AuthenticationResult,
        userId: userId
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Login failed",
        message: err.message
      })
    };
  }
};