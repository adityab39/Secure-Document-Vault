import crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  SignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dbClient = new DynamoDBClient({ region: "us-east-2" });
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);
const saveUserMetadata = async (email, name) => {
  const params = {
    TableName: "users",
    Item: {
      userId: uuidv4(),
      email: email,
      name: name,
      registeredAt: new Date().toISOString()
    }
  };

  const command = new PutCommand(params);
  await ddbDocClient.send(command);
};

const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

function generateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

export const handler = async (event) => {
  const { email, password, name } = JSON.parse(event.body);

  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;

  const secretHash = generateSecretHash(email, clientId, clientSecret);

  const params = {
    ClientId: clientId,
    Username: email,
    Password: password,
    SecretHash: secretHash,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name }
    ]
  };

  try {
    const command = new SignUpCommand(params);
    const response = await client.send(command);
    await saveUserMetadata(email, name);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User registered", response })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message })
    };
  }
};