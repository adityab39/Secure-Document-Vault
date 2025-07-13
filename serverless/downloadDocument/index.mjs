import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyTokenFromHeader } from "/opt/verifyToken/index.mjs";


const REGION = "us-east-2";
const s3 = new S3Client({ region: REGION });
const dbClient = new DynamoDBClient({ region: REGION });
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
    const userPayload = await verifyTokenFromHeader(authHeader);
    const email = userPayload.email;

    const documentId = event.queryStringParameters?.documentId;
    if (!documentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing documentId in query string" }),
      };
    }

    const user = await getUserFromDb(email);
    const userId = user.userId;

    const docParams = {
      TableName: process.env.USER_DOCUMENTS_TABLE,
      Key: { userId, documentId }
    };
    const result = await ddb.send(new GetCommand(docParams));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Document not found" }),
      };
    }

    const s3Key = result.Item.s3Key;
    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
    };

    const fileName = s3Key.split('/').pop(); 
    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`
    }), { expiresIn: 60 });

    return {
      statusCode: 302,
      headers: {
        Location: url,
      },
    };

  } catch (err) {
    console.error("Error downloading document:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to download document", error: err.message }),
    };
  }
};