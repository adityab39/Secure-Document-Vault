import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyTokenFromHeader } from "/opt/verifyToken/index.mjs";

const s3 = new S3Client({ region: "us-east-2" });
const dbClient = new DynamoDBClient({ region: "us-east-2" });
const ddb = DynamoDBDocumentClient.from(dbClient);

const getUserFromDb = async (email) => {
  const params = {
    TableName: process.env.USERS_TABLE || "users",
    Key: { email },
  };

  try {
    const result = await ddb.send(new GetCommand(params));
    if (!result.Item) {
      throw new Error("User not found");
    }
    return result.Item;
  } catch (err) {
    throw new Error("Error fetching user from DB: " + err.message);
  }
};

export const handler = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const tokenPayload = await verifyTokenFromHeader(authHeader);
    const email = tokenPayload.email;

    const documentId = event.queryStringParameters?.documentId;
    if (!documentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing documentId in query" }),
      };
    }

    const user = await getUserFromDb(email);
    const userId = user.userId;

    const getParams = {
      TableName: process.env.USER_DOCUMENTS_TABLE,
      Key: { userId, documentId },
    };
    const getResult = await ddb.send(new GetCommand(getParams));
    const item = getResult.Item;

    if (!item || !item.s3Key) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Document not found or missing s3Key" }),
      };
    }

    const s3Key = item.s3Key;

    if (!email || !documentId || !s3Key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email, documentId, or s3Key" }),
      };
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
      })
    );

    await ddb.send(
      new DeleteCommand({
        TableName: process.env.USER_DOCUMENTS_TABLE || "user_documents",
        Key: {
          userId,
          documentId,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Document deleted successfully" }),
    };
  } catch (err) {
    console.error("Delete Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to delete document", error: err.message }),
    };
  }
};