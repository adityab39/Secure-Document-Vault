import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { verifyTokenFromHeader } from "/opt/verifyToken/index.mjs";

const dbClient = new DynamoDBClient({ region: "us-east-2" });
const ddb = DynamoDBDocumentClient.from(dbClient);

export const handler = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const userPayload = await verifyTokenFromHeader(authHeader);
    const email = userPayload?.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email not found in token" }),
      };
    }

    const userResult = await ddb.send(
      new GetCommand({
        TableName: "users",
        Key: { email },
      })
    );

    if (!userResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found in users table" }),
      };
    }

    const userId = userResult.Item.userId;

    const docsResult = await ddb.send(
      new QueryCommand({
        TableName: "user_documents",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ documents: docsResult.Items }),
    };
  } catch (err) {
    console.error("Error fetching user documents:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to fetch documents",
        message: err.message,
      }),
    };
  }
};