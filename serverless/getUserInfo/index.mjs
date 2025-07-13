
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyTokenFromHeader } from "/opt/verifyToken/index.mjs";

const REGION = "us-east-2";
const client = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const payload = await verifyTokenFromHeader(authHeader);
    const email = payload.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email not found in token" }),
      };
    }

    const params = {
      TableName: "users",
      Key: { email },
    };

    const command = new GetCommand(params);
    const result = await ddbDocClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User info fetched successfully",
        user: result.Item,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch user info",
        message: err.message,
      }),
    };
  }
};