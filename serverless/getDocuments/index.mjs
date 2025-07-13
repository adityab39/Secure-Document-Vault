import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import url from "url";

const client = new DynamoDBClient({ region: "us-east-2" });
const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DOCUMENT_TYPES_TABLE;

export const handler = async (event) => {
  try {
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const result = await ddb.send(command);

    const documentTypes = (result.Items || [])
      .filter(item => item.enabled !== false)
      .map(item => {
        let objectKey = null;
        if (item.sampleImageUrl) {
          const parsedUrl = url.parse(item.sampleImageUrl);
          objectKey = parsedUrl.pathname.split("/").slice(2).join("/");
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

    return {
      statusCode: 200,
      body: JSON.stringify({ documentTypes }),
    };
  } catch (err) {
    console.error("Error fetching document types:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve document types" }),
    };
  }
};