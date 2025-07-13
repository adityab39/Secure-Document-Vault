import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { PassThrough } from "stream";
import Busboy from "busboy";
import { Buffer } from "buffer";

import { verifyTokenFromHeader } from "/opt/verifyToken/index.mjs";

const s3 = new S3Client({ region: "us-east-2" });
const dbClient = new DynamoDBClient({ region: "us-east-2" });
const ddb = DynamoDBDocumentClient.from(dbClient);

export const handler = async (event) => {
  return new Promise(async (resolve) => {
    try {
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      const userPayload = await verifyTokenFromHeader(authHeader);

      const contentType = event.headers["Content-Type"] || event.headers["content-type"];
      const busboy = Busboy({ headers: { "content-type": contentType } });

      let fileBuffer = Buffer.alloc(0);
      let fileName, mimeType;
      let typeId, typeName;
      let userId;

      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (typeof filename === "object" && filename?.filename) {
          fileName = filename.filename;
        } else {
          fileName = filename;
        }
      
        mimeType = mimetype;
      
        file.on("data", (data) => {
          fileBuffer = Buffer.concat([fileBuffer, data]);
        });
      });

      busboy.on("field", (fieldname, val) => {
        if (fieldname === "typeId") typeId = val;
        if (fieldname === "typeName") typeName = val;
        if (fieldname === "userId") userId = val;
      });

      busboy.on("finish", async () => {
        if (!fileName || !typeId || !typeName) {
          return resolve({
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields" })
          });
        }

        console.log("fileName raw:", fileName);
        console.log("typeof fileName:", typeof fileName);

        const actualFileName = typeof fileName === "string" ? fileName : String(fileName?.toString?.() || "file");
        const cleanFileName = actualFileName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
        const finalFileName = `${uuidv4()}-${cleanFileName}`;
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: finalFileName,
          Body: fileBuffer,
          ContentType: mimeType
        };

        await s3.send(new PutObjectCommand(uploadParams));

        const documentId = uuidv4();
        const dbParams = {
          TableName: process.env.USER_DOCUMENTS_TABLE,
          Item: {
            userId,
            documentId,
            typeId,
            typeName,
            s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${finalFileName}`,
            s3Key: finalFileName,
            uploadedAt: new Date().toISOString()
          }
        };

        await ddb.send(new PutCommand(dbParams));

        return resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: "File uploaded and recorded successfully",
            document: dbParams.Item
          })
        });
      });

      const body = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
      const stream = new PassThrough();
      stream.end(body);
      stream.pipe(busboy);
    } catch (err) {
      console.error("Upload error:", err);
      return resolve({
        statusCode: 500,
        body: JSON.stringify({ message: "Upload failed", error: err.message })
      });
    }
  });
};