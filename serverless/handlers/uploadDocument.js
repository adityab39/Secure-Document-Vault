const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../utils/s3Client");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body); // parse JSON input

    const { userId, typeId, typeName, fileName, fileContentBase64, fileType } = body;

    if (!userId || !typeId || !typeName || !fileName || !fileContentBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const fileBuffer = Buffer.from(fileContentBase64, 'base64');
    const finalFileName = `${uuidv4()}-${fileName}`;

    const params = {
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: finalFileName,
      Body: fileBuffer,
      ContentType: fileType,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const fileUrl = `https://${process.env.MY_AWS_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${finalFileName}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded successfully",
        fileUrl,
        fileName: finalFileName
      }),
    };

  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Upload failed", error: err.message,stack: err.stack }),
    };
  }
};
